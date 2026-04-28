export interface PaymentItem {
  id: string;
  description: string;
  amountCents: number;
  position: number;
  status: 'unpaid' | 'processing' | 'paid' | 'failed';
  assignedUserId: string | null;
  assignedUserName: string | null;
  assignedUserAvatarUrl: string | null;
  paidBy: string | null;
  paidByName: string | null;
  paidByAvatarUrl: string | null;
  paidAt: string | null;
}

export interface ExtractedReceiptItem {
  description: string;
  amountCents: number;
}

export interface ExtractedReceipt {
  parseStatus: 'ok' | 'not_a_receipt' | 'illegible';
  title: string;
  merchantName?: string;
  purchaseDate?: string;
  currency: string;
  subtotalCents?: number;
  taxCents?: number;
  tipCents?: number;
  totalAmountCents: number;
  items: ExtractedReceiptItem[];
  model: string;
  extractedAt: string;
}

export interface PaymentData {
  id: string;
  title: string;
  note: string | null;
  mode: 'per_item' | 'per_person' | 'direct';
  recipientId: string | null;
  recipientName: string | null;
  totalAmountCents: number;
  currency: string;
  status: 'active' | 'completed' | 'cancelled';
  items: PaymentItem[];
  creatorId: string;
  createdAt: string;
  extractedReceipt: ExtractedReceipt | null;
}
