/**
 * A conversation prompt that can be assigned to groups
 */
export interface Prompt {
  id: string;
  text: string;
  category?: string;
}

/**
 * A prompt that is pending response from the current user
 */
export interface PendingPrompt {
  groupId: string;
  groupName: string;
  prompt: Prompt;
}

/**
 * API response for GET /api/prompts/todo
 */
export interface PendingPromptsResponse {
  prompts: PendingPrompt[];
  allComplete: boolean;
}

/**
 * A response to a prompt from a user
 */
export interface PromptResponse {
  id: string;
  prompt: Prompt;
  user: {
    id: string;
    displayName: string | null;
    avatarUrl: string | null;
  };
  groupId: string;
  groupName: string;
  content: string;
  createdAt: string;
}

/**
 * API response for GET /api/prompts/feed
 */
export interface FeedResponse {
  responses: PromptResponse[];
}

/**
 * Request body for POST /api/prompts/respond
 */
export interface SubmitPromptRequest {
  groupId: string;
  content: string;
}
