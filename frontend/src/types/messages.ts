export interface MessageSender {
  id: string;
  displayName: string | null;
  handle: string | null;
  avatarUrl: string | null;
}

export interface Message {
  id: string;
  groupId: string;
  sender: MessageSender;
  content: string;
  createdAt: string;
  // For optimistic updates
  pending?: boolean;
  error?: boolean;
}

export interface MessageListResponse {
  messages: Message[];
  nextCursor: string | null;
  hasMore: boolean;
}

export interface SendMessageRequest {
  content: string;
}
