import { z } from 'zod';

export const savedProviderRecordSchema = z.object({
  providerId: z.string().min(1),
  savedAt: z.unknown().optional(),
});

export type SavedProviderRecord = z.infer<typeof savedProviderRecordSchema>;
