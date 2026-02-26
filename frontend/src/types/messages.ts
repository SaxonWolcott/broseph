export interface MessageSender {
  id: string;
  displayName: string | null;
  handle: string | null;
  avatarUrl: string | null;
}

export interface PromptData {
  promptId: string;
  promptText: string;
  promptCategory?: string;
  responseContent: string;
  responseSenderName?: string;
  responseSenderAvatarUrl?: string;
}

export interface ReplyToPreview {
  senderName: string | null;
  senderAvatarUrl: string | null;
  content: string;
  imageUrls?: string[] | null;
}

export interface Reaction {
  emoji: string;
  count: number;
  hasReacted: boolean;
}

export interface ToggleReactionResponse {
  action: 'added' | 'removed';
  reactions: Reaction[];
}

export interface Message {
  id: string;
  groupId: string;
  sender: MessageSender | null;
  content: string;
  createdAt: string;
  type: 'message' | 'system' | 'prompt_response';
  promptResponseId?: string | null;
  promptData?: PromptData | null;
  replyCount?: number | null;
  imageUrls?: string[] | null;
  replyToId?: string | null;
  replyToPreview?: ReplyToPreview | null;
  reactions?: Reaction[] | null;
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
  content?: string;
  imageUrls?: string[];
  promptResponseId?: string;
  replyInChat?: boolean;
  replyToId?: string;
}
