import { z } from 'zod';
import { LIMITS } from '../constants/limits';

export const sendMessageSchema = z.object({
  content: z.string().min(1).max(LIMITS.MAX_MESSAGE_LENGTH),
});

export const messageSchema = z.object({
  id: z.string().uuid(),
  group_id: z.string().uuid(),
  sender_id: z.string().uuid().nullable(),
  content: z.string(),
  created_at: z.string().datetime(),
  type: z.enum(['message', 'system']).default('message'),
});

export const messagesQuerySchema = z.object({
  cursor: z.string().uuid().optional(),
  limit: z.coerce.number().int().min(1).max(100).default(50),
});

export type SendMessageInput = z.infer<typeof sendMessageSchema>;
export type Message = z.infer<typeof messageSchema>;
export type MessagesQuery = z.infer<typeof messagesQuerySchema>;
