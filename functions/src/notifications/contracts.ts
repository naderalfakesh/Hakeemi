import { z } from 'zod';

import { documentIdSchema, NOTIFICATION_PLATFORMS, SUPPORTED_LOCALES } from '../shared/schemas.js';

export const registerDeviceTokenRequestSchema = z
  .object({
    enabled: z.boolean().default(true),
    locale: z.enum(SUPPORTED_LOCALES),
    platform: z.enum(NOTIFICATION_PLATFORMS),
    token: z.string().trim().min(16).max(4096),
  })
  .strict();

export const registerDeviceTokenResultSchema = z
  .object({
    enabled: z.boolean(),
    tokenId: z.string().regex(/^[0-9a-f]{64}$/),
  })
  .strict();

// Raw token proves device possession; optional userId flushes an offline sign-out.
export const unregisterDeviceTokenRequestSchema = z
  .object({
    token: z.string().trim().min(16).max(4096),
    userId: documentIdSchema.optional(),
  })
  .strict();

export const unregisterDeviceTokenResultSchema = z
  .object({
    disabled: z.boolean(),
    tokenId: z.string().regex(/^[0-9a-f]{64}$/),
  })
  .strict();

export type RegisterDeviceTokenRequest = z.infer<typeof registerDeviceTokenRequestSchema>;
export type RegisterDeviceTokenResult = z.infer<typeof registerDeviceTokenResultSchema>;
export type UnregisterDeviceTokenRequest = z.infer<typeof unregisterDeviceTokenRequestSchema>;
export type UnregisterDeviceTokenResult = z.infer<typeof unregisterDeviceTokenResultSchema>;
