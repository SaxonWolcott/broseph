import {
  Injectable,
  ForbiddenException,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  SupabaseService,
  PaymentRequestDto,
  PaymentItemDto,
  CheckoutSessionResponseDto,
} from '@app/shared';
import { StripeService } from './stripe.service';

@Injectable()
export class PaymentsService {
  constructor(
    private supabaseService: SupabaseService,
    private stripeService: StripeService,
    private configService: ConfigService,
  ) {}

  async getPaymentRequest(paymentRequestId: string): Promise<PaymentRequestDto> {
    const adminClient = this.supabaseService.getAdminClient();

    const { data: request, error } = await adminClient
      .from('payment_requests')
      .select('*')
      .eq('id', paymentRequestId)
      .single();

    if (error || !request) {
      throw new NotFoundException('Payment request not found');
    }

    return this.buildPaymentRequestDto(request);
  }

  async getActivePaymentCounts(
    groupId: string,
    userId: string,
  ): Promise<{ activeCount: number; attentionCount: number }> {
    const adminClient = this.supabaseService.getAdminClient();

    // Count active payment requests
    const { count: activeCount } = await adminClient
      .from('payment_requests')
      .select('id', { count: 'exact', head: true })
      .eq('group_id', groupId)
      .eq('status', 'active');

    // Count requests where this user has unpaid assigned items
    const { data: requestIds } = await adminClient
      .from('payment_requests')
      .select('id')
      .eq('group_id', groupId)
      .eq('status', 'active');

    let attentionCount = 0;
    if (requestIds && requestIds.length > 0) {
      const ids = requestIds.map((r) => r.id);
      const { data: attentionItems } = await adminClient
        .from('payment_items')
        .select('payment_request_id')
        .in('payment_request_id', ids)
        .eq('assigned_user_id', userId)
        .in('status', ['unpaid', 'failed']);

      // Count distinct payment requests that need attention
      const uniqueRequests = new Set((attentionItems || []).map((i) => i.payment_request_id));
      attentionCount = uniqueRequests.size;
    }

    return { activeCount: activeCount || 0, attentionCount };
  }

  async listActivePaymentRequests(groupId: string): Promise<PaymentRequestDto[]> {
    const adminClient = this.supabaseService.getAdminClient();

    const { data: requests } = await adminClient
      .from('payment_requests')
      .select('*')
      .eq('group_id', groupId)
      .eq('status', 'active')
      .order('created_at', { ascending: false });

    if (!requests || requests.length === 0) return [];

    const requestIds = requests.map((r) => r.id);
    const { data: items } = await adminClient
      .from('payment_items')
      .select('*')
      .in('payment_request_id', requestIds)
      .order('position');

    const userIds = this.collectUserIds(requests, items || []);
    const profileMap = await this.fetchProfiles(userIds);

    return requests.map((r) =>
      this.mapToDto(r, (items || []).filter((i) => i.payment_request_id === r.id), profileMap),
    );
  }

  async initiateCheckout(
    paymentRequestId: string,
    itemId: string,
    userId: string,
    groupId: string,
  ): Promise<CheckoutSessionResponseDto> {
    const adminClient = this.supabaseService.getAdminClient();

    // Fetch payment request
    const { data: request, error: reqError } = await adminClient
      .from('payment_requests')
      .select('*')
      .eq('id', paymentRequestId)
      .single();

    if (reqError || !request) {
      throw new NotFoundException('Payment request not found');
    }

    if (request.status !== 'active') {
      throw new BadRequestException('Payment request is not active');
    }

    // Fetch the specific item
    const { data: item, error: itemError } = await adminClient
      .from('payment_items')
      .select('*')
      .eq('id', itemId)
      .eq('payment_request_id', paymentRequestId)
      .single();

    if (itemError || !item) {
      throw new NotFoundException('Payment item not found');
    }

    if (item.status !== 'unpaid') {
      throw new BadRequestException('This item is already being paid or has been paid');
    }

    // For per_person mode, only the assigned user can pay
    if (request.mode === 'per_person' && item.assigned_user_id && item.assigned_user_id !== userId) {
      throw new ForbiddenException('This item is assigned to a different user');
    }

    // Set item to processing
    await adminClient
      .from('payment_items')
      .update({
        status: 'processing',
        paid_by: userId,
      })
      .eq('id', itemId)
      .eq('status', 'unpaid'); // Concurrency guard

    const frontendUrl = this.configService.get<string>('SITE_URL', 'http://localhost:5173');
    const description = `${request.title}: ${item.description}`;

    const result = await this.stripeService.createCheckoutSession({
      paymentItemId: itemId,
      payerId: userId,
      description,
      amountCents: item.amount_cents,
      currency: request.currency,
      successUrl: `${frontendUrl}/groups/${groupId}?payment=success&session_id={CHECKOUT_SESSION_ID}`,
      cancelUrl: `${frontendUrl}/groups/${groupId}?payment=cancelled`,
    });

    // Store session ID on the item
    await adminClient
      .from('payment_items')
      .update({ stripe_checkout_session_id: result.sessionId })
      .eq('id', itemId);

    return result;
  }

  async cancelPaymentRequest(paymentRequestId: string, userId: string): Promise<PaymentRequestDto> {
    const adminClient = this.supabaseService.getAdminClient();

    const { data: request, error } = await adminClient
      .from('payment_requests')
      .select('*')
      .eq('id', paymentRequestId)
      .single();

    if (error || !request) {
      throw new NotFoundException('Payment request not found');
    }

    if (request.creator_id !== userId) {
      throw new ForbiddenException('Only the creator can cancel a payment request');
    }

    if (request.status !== 'active') {
      throw new BadRequestException('Payment request is not active');
    }

    await adminClient
      .from('payment_requests')
      .update({ status: 'cancelled', updated_at: new Date().toISOString() })
      .eq('id', paymentRequestId);

    // Re-fetch
    const { data: updated } = await adminClient
      .from('payment_requests')
      .select('*')
      .eq('id', paymentRequestId)
      .single();

    return this.buildPaymentRequestDto(updated!);
  }

  /**
   * Handle successful Stripe checkout — called by the worker.
   */
  async handleCheckoutCompleted(
    checkoutSessionId: string,
    paymentIntentId: string,
    payerId: string,
  ): Promise<void> {
    const adminClient = this.supabaseService.getAdminClient();

    // Find the payment item by checkout session ID
    const { data: item } = await adminClient
      .from('payment_items')
      .select('*, payment_request_id')
      .eq('stripe_checkout_session_id', checkoutSessionId)
      .single();

    if (!item) return; // Idempotent — already processed or not found

    // Update item to paid
    await adminClient
      .from('payment_items')
      .update({
        status: 'paid',
        paid_by: payerId,
        paid_at: new Date().toISOString(),
        stripe_payment_intent_id: paymentIntentId,
      })
      .eq('id', item.id);

    // Check if all items are now paid
    await this.checkAllItemsPaid(item.payment_request_id);
  }

  /**
   * Handle expired/failed checkout session — called by the worker.
   */
  async handleCheckoutExpired(checkoutSessionId: string): Promise<void> {
    const adminClient = this.supabaseService.getAdminClient();

    // Reset item back to unpaid
    await adminClient
      .from('payment_items')
      .update({
        status: 'unpaid',
        paid_by: null,
        stripe_checkout_session_id: null,
      })
      .eq('stripe_checkout_session_id', checkoutSessionId)
      .eq('status', 'processing');
  }

  /**
   * Batch-fetch payment data for message enrichment (like batchFetchPollData).
   */
  async batchFetchPaymentData(
    messageIds: string[],
  ): Promise<Map<string, PaymentRequestDto>> {
    if (messageIds.length === 0) return new Map();

    const adminClient = this.supabaseService.getAdminClient();

    const { data: requests } = await adminClient
      .from('payment_requests')
      .select('*')
      .in('message_id', messageIds);

    if (!requests || requests.length === 0) return new Map();

    const requestIds = requests.map((r) => r.id);

    const { data: items } = await adminClient
      .from('payment_items')
      .select('*')
      .in('payment_request_id', requestIds)
      .order('position');

    const userIds = this.collectUserIds(requests, items || []);
    const profileMap = await this.fetchProfiles(userIds);

    const result = new Map<string, PaymentRequestDto>();
    for (const request of requests) {
      const requestItems = (items || []).filter((i) => i.payment_request_id === request.id);
      result.set(request.message_id, this.mapToDto(request, requestItems, profileMap));
    }

    return result;
  }

  // ── Private helpers ──

  private async buildPaymentRequestDto(
    request: Record<string, unknown>,
  ): Promise<PaymentRequestDto> {
    const adminClient = this.supabaseService.getAdminClient();

    const { data: items } = await adminClient
      .from('payment_items')
      .select('*')
      .eq('payment_request_id', request.id as string)
      .order('position');

    const userIds = this.collectUserIds([request], items || []);
    const profileMap = await this.fetchProfiles(userIds);

    return this.mapToDto(request, items || [], profileMap);
  }

  private collectUserIds(
    requests: Record<string, unknown>[],
    items: Record<string, unknown>[],
  ): string[] {
    const ids = new Set<string>();
    for (const r of requests) {
      if (r.recipient_id) ids.add(r.recipient_id as string);
    }
    for (const i of items) {
      if (i.assigned_user_id) ids.add(i.assigned_user_id as string);
      if (i.paid_by) ids.add(i.paid_by as string);
    }
    return [...ids];
  }

  private async fetchProfiles(
    userIds: string[],
  ): Promise<Map<string, { display_name: string | null; avatar_url: string | null }>> {
    if (userIds.length === 0) return new Map();
    const adminClient = this.supabaseService.getAdminClient();
    const { data: profiles } = await adminClient
      .from('profiles')
      .select('id, display_name, avatar_url')
      .in('id', userIds);
    return new Map(
      (profiles || []).map((p) => [
        p.id,
        { display_name: p.display_name, avatar_url: p.avatar_url },
      ]),
    );
  }

  private mapToDto(
    request: Record<string, unknown>,
    items: Record<string, unknown>[],
    profileMap: Map<string, { display_name: string | null; avatar_url: string | null }>,
  ): PaymentRequestDto {
    const recipientProfile = request.recipient_id
      ? profileMap.get(request.recipient_id as string)
      : null;

    const itemDtos: PaymentItemDto[] = items.map((i) => {
      const assignedProfile = i.assigned_user_id
        ? profileMap.get(i.assigned_user_id as string)
        : null;
      const paidByProfile = i.paid_by
        ? profileMap.get(i.paid_by as string)
        : null;

      return {
        id: i.id as string,
        description: i.description as string,
        amountCents: i.amount_cents as number,
        position: i.position as number,
        status: i.status as PaymentItemDto['status'],
        assignedUserId: (i.assigned_user_id as string) ?? null,
        assignedUserName: assignedProfile?.display_name ?? null,
        assignedUserAvatarUrl: assignedProfile?.avatar_url ?? null,
        paidBy: (i.paid_by as string) ?? null,
        paidByName: paidByProfile?.display_name ?? null,
        paidByAvatarUrl: paidByProfile?.avatar_url ?? null,
        paidAt: (i.paid_at as string) ?? null,
      };
    });

    return {
      id: request.id as string,
      title: request.title as string,
      mode: request.mode as PaymentRequestDto['mode'],
      recipientId: (request.recipient_id as string) ?? null,
      recipientName: recipientProfile?.display_name ?? null,
      totalAmountCents: request.total_amount_cents as number,
      currency: request.currency as string,
      status: request.status as PaymentRequestDto['status'],
      items: itemDtos,
      creatorId: request.creator_id as string,
      createdAt: request.created_at as string,
    };
  }

  private async checkAllItemsPaid(paymentRequestId: string): Promise<void> {
    const adminClient = this.supabaseService.getAdminClient();

    const { data: items } = await adminClient
      .from('payment_items')
      .select('status')
      .eq('payment_request_id', paymentRequestId);

    if (!items) return;

    const allPaid = items.every((i) => i.status === 'paid');
    if (allPaid) {
      await adminClient
        .from('payment_requests')
        .update({ status: 'completed', updated_at: new Date().toISOString() })
        .eq('id', paymentRequestId)
        .eq('status', 'active'); // Concurrency guard
    }
  }
}
