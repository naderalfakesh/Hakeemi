import { z } from 'zod';

export const notificationRegistrationResultSchema = z
  .object({
    enabled: z.boolean(),
    tokenId: z.string().regex(/^[0-9a-f]{64}$/),
  })
  .strict();

export type NotificationRegistrationResult = z.infer<typeof notificationRegistrationResultSchema>;
