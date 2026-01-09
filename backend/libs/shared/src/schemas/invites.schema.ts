import { z } from 'zod';

export const createInviteSchema = z.object({
  email: z.string().email().optional(),
});

export const inviteSchema = z.object({
  id: z.string().uuid(),
  group_id: z.string().uuid(),
  invited_by: z.string().uuid(),
  invite_token: z.string(),
  email: z.string().email().nullable(),
  expires_at: z.string().datetime(),
  used_at: z.string().datetime().nullable(),
  used_by: z.string().uuid().nullable(),
  created_at: z.string().datetime(),
});

export type CreateInviteInput = z.infer<typeof createInviteSchema>;
export type Invite = z.infer<typeof inviteSchema>;
