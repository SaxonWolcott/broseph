export interface SendMessageJobDto {
  groupId: string;
  senderId: string;
  content: string;
  clientMessageId?: string; // For optimistic UI correlation
}

export interface SendMessageJobResult {
  messageId: string;
  createdAt: string;
}
