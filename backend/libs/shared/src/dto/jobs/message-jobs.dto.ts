export interface SendMessageJobDto {
  groupId: string;
  senderId: string;
  content: string;
  clientMessageId?: string; // For optimistic UI correlation
  promptResponseId?: string; // For replies to prompt responses
  replyInChat?: boolean; // true = visible in chat stream, false = popup only
  replyToId?: string; // General message reply
}

export interface SendMessageJobResult {
  messageId: string;
  createdAt: string;
}
