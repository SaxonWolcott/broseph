import { z } from 'zod';
import { LIMITS } from '../constants/limits';

export const submitPromptResponseSchema = z.object({
  groupId: z.string().uuid(),
  content: z.string().min(1).max(LIMITS.MAX_MESSAGE_LENGTH),
});

export const promptResponseSchema = z.object({
  id: z.string().uuid(),
  group_id: z.string().uuid(),
  user_id: z.string().uuid(),
  prompt_id: z.string(),
  response_date: z.string(),
  content: z.string(),
  created_at: z.string().datetime(),
});

export type SubmitPromptResponseInput = z.infer<typeof submitPromptResponseSchema>;
export type PromptResponseRecord = z.infer<typeof promptResponseSchema>;
