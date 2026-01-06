import { z } from 'zod';

export const profileSchema = z.object({
  id: z.string().uuid(),
  display_name: z.string().max(100).nullable(),
  handle: z
    .string()
    .max(50)
    .regex(/^[a-zA-Z0-9_]+$/)
    .nullable(),
  avatar_url: z.string().url().nullable(),
  created_at: z.string().datetime(),
  updated_at: z.string().datetime(),
});

export const magicLinkRequestSchema = z.object({
  email: z.string().email(),
  redirectTo: z.string().url().optional(),
});

export const onboardSchema = z.object({
  displayName: z.string().max(100).optional(),
  handle: z
    .string()
    .max(50)
    .regex(/^[a-zA-Z0-9_]+$/)
    .optional(),
});

export type Profile = z.infer<typeof profileSchema>;
export type MagicLinkRequest = z.infer<typeof magicLinkRequestSchema>;
export type OnboardRequest = z.infer<typeof onboardSchema>;
