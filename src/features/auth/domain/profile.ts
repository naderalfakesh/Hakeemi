import { z } from 'zod';

export const userProfileSchema = z.object({
  displayName: z.string().min(1),
  email: z.string().email(),
  id: z.string().min(1),
  locale: z.enum(['en', 'ar']),
  photoURL: z.string().url().nullable(),
  role: z.literal('patient'),
  theme: z.enum(['system', 'light', 'dark']),
});

export type UserProfile = z.infer<typeof userProfileSchema>;
