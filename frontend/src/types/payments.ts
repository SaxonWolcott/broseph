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

export interface PaymentData {
  id: string;
  title: string;
  mode: 'per_item' | 'per_person' | 'direct';
  recipientId: string | null;
  recipientName: string | null;
  totalAmountCents: number;
  currency: string;
  status: 'active' | 'completed' | 'cancelled';
  items: PaymentItem[];
  creatorId: string;
  createdAt: string;
}
