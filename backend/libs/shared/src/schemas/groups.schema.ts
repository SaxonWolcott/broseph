import { z } from 'zod';
import { LIMITS } from '../constants/limits';

export const createGroupSchema = z.object({
  name: z.string().min(1).max(LIMITS.MAX_GROUP_NAME_LENGTH),
});

export const groupSchema = z.object({
  id: z.string().uuid(),
  name: z.string(),
  owner_id: z.string().uuid(),
  created_at: z.string().datetime(),
  updated_at: z.string().datetime(),
});

export const groupMemberSchema = z.object({
  id: z.string().uuid(),
  group_id: z.string().uuid(),
  user_id: z.string().uuid(),
  role: z.enum(['owner', 'member']),
  joined_at: z.string().datetime(),
});

export type CreateGroupInput = z.infer<typeof createGroupSchema>;
export type Group = z.infer<typeof groupSchema>;
export type GroupMember = z.infer<typeof groupMemberSchema>;
