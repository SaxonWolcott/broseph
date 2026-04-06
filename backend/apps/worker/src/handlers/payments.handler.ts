import { Injectable, Logger } from '@nestjs/common';
import { Job } from 'bullmq';
import {
  SupabaseService,
  CreatePaymentRequestJobDto,
  CreatePaymentRequestJobResult,
  ProcessStripeWebhookJobDto,
} from '@app/shared';

@Injectable()
export class PaymentsHandler {
  private readonly logger = new Logger(PaymentsHandler.name);

  constructor(private supabaseService: SupabaseService) {}

  async handleCreatePaymentRequest(
    job: Job<CreatePaymentRequestJobDto>,
  ): Promise<CreatePaymentRequestJobResult> {
    const { groupId, creatorId, title, mode, recipientId, items } = job.data;
    this.logger.log(`Creating payment request "${title}" in group ${groupId}`);

    const adminClient = this.supabaseService.getAdminClient();

    // Verify membership
    const { data: membership, error: memberError } = await adminClient
      .from('group_members')
      .select('id')
      .eq('group_id', groupId)
      .eq('user_id', creatorId)
      .maybeSingle();

    if (memberError || !membership) {
      throw new Error('User is not a member of this group');
    }

    // Calculate total
    const totalAmountCents = items.reduce((sum, item) => sum + item.amountCents, 0);

    // 1. Insert message with type 'payment'
    const { data: message, error: msgError } = await adminClient
      .from('messages')
      .insert({
        group_id: groupId,
        sender_id: creatorId,
        content: title,
        type: 'payment',
      })
      .select('id')
      .single();

    if (msgError || !message) {
      throw new Error(`Failed to create payment message: ${msgError?.message}`);
    }

    // 2. Insert payment request
    const { data: paymentRequest, error: prError } = await adminClient
      .from('payment_requests')
      .insert({
        message_id: message.id,
        group_id: groupId,
        creator_id: creatorId,
        title,
        mode,
        recipient_id: recipientId ?? null,
        total_amount_cents: totalAmountCents,
        currency: 'usd',
      })
      .select('id')
      .single();

    if (prError || !paymentRequest) {
      throw new Error(`Failed to create payment request: ${prError?.message}`);
    }

    // 3. Insert payment items
    const itemRows = items.map((item, i) => ({
      payment_request_id: paymentRequest.id,
      description: item.description,
      amount_cents: item.amountCents,
      assigned_user_id: item.assignedUserId ?? null,
      position: i,
    }));

    const { error: itemError } = await adminClient
      .from('payment_items')
      .insert(itemRows);

    if (itemError) {
      throw new Error(`Failed to create payment items: ${itemError.message}`);
    }

    this.logger.log(
      `Payment request ${paymentRequest.id} created for message ${message.id}`,
    );
    return { messageId: message.id, paymentRequestId: paymentRequest.id };
  }

  async handleStripeWebhook(
    job: Job<ProcessStripeWebhookJobDto>,
  ): Promise<{ handled: boolean }> {
    const { eventType, eventId, eventData } = job.data;
    this.logger.log(`Processing Stripe event ${eventType} (${eventId})`);

    const adminClient = this.supabaseService.getAdminClient();

    switch (eventType) {
      case 'checkout.session.completed': {
        const sessionId = eventData.id as string;
        const paymentIntentId = (eventData.payment_intent as string) ?? null;
        const metadata = eventData.metadata as Record<string, string> | undefined;
        const payerId = metadata?.payerId;

        if (!sessionId) break;

        // Find the payment item by checkout session ID
        const { data: item } = await adminClient
          .from('payment_items')
          .select('id, payment_request_id')
          .eq('stripe_checkout_session_id', sessionId)
          .single();

        if (!item) {
          this.logger.warn(`No payment item found for session ${sessionId}`);
          break;
        }

        // Update item to paid
        await adminClient
          .from('payment_items')
          .update({
            status: 'paid',
            paid_by: payerId ?? null,
            paid_at: new Date().toISOString(),
            stripe_payment_intent_id: paymentIntentId,
          })
          .eq('id', item.id);

        // Check if all items are paid
        const { data: allItems } = await adminClient
          .from('payment_items')
          .select('status')
          .eq('payment_request_id', item.payment_request_id);

        if (allItems && allItems.every((i) => i.status === 'paid')) {
          await adminClient
            .from('payment_requests')
            .update({
              status: 'completed',
              updated_at: new Date().toISOString(),
            })
            .eq('id', item.payment_request_id)
            .eq('status', 'active');
        }

        this.logger.log(`Payment item ${item.id} marked as paid`);
        break;
      }

      case 'checkout.session.expired': {
        const sessionId = eventData.id as string;
        if (!sessionId) break;

        // Reset item back to unpaid
        await adminClient
          .from('payment_items')
          .update({
            status: 'unpaid',
            paid_by: null,
            stripe_checkout_session_id: null,
          })
          .eq('stripe_checkout_session_id', sessionId)
          .eq('status', 'processing');

        this.logger.log(`Checkout session ${sessionId} expired, item reset`);
        break;
      }

      default:
        this.logger.log(`Ignoring unhandled Stripe event type: ${eventType}`);
    }

    return { handled: true };
  }
}
