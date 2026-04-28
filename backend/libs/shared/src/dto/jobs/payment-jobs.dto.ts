import type { ExtractedReceipt } from '../payments.dto';

export interface CreatePaymentRequestJobDto {
  groupId: string;
  creatorId: string;
  title: string;
  note?: string;
  extractedReceipt?: ExtractedReceipt;
  mode: 'per_item' | 'per_person' | 'direct';
  recipientId?: string;
  items: {
    description: string;
    amountCents: number;
    assignedUserId?: string;
  }[];
}

export interface CreatePaymentRequestJobResult {
  messageId: string;
  paymentRequestId: string;
}

export interface ProcessStripeWebhookJobDto {
  eventType: string;
  eventId: string;
  eventData: Record<string, unknown>;
}
