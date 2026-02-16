/**
 * A conversation prompt that can be assigned to groups
 */
export interface Prompt {
  id: string;
  text: string;
  category?: string;
}

/**
 * A user who has responded to a prompt (with full response data)
 */
export interface PromptRespondent {
  userId: string;
  displayName: string | null;
  avatarUrl: string | null;
  responseId: string;
  content: string;
  createdAt: string;
  replyCount: number;
}

/**
 * API response for GET /api/prompts/group/:groupId/today
 */
export interface GroupPromptTodayResponse {
  prompt: Prompt;
  hasResponded: boolean;
  respondents: PromptRespondent[];
}

/**
 * Request body for POST /api/prompts/respond
 */
export interface SubmitPromptRequest {
  groupId: string;
  content: string;
}

/**
 * A reply to a prompt response
 */
export interface PromptResponseReply {
  id: string;
  sender: {
    id: string;
    displayName: string | null;
    avatarUrl: string | null;
  };
  content: string;
  createdAt: string;
}

/**
 * API response for GET /api/prompts/responses/:responseId/replies
 */
export interface PromptResponseRepliesResponse {
  replies: PromptResponseReply[];
}
