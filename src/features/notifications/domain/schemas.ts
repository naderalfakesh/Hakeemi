import { z } from 'zod';

export const notificationRegistrationResultSchema = z
  .object({
    enabled: z.boolean(),
    tokenId: z.string().regex(/^[0-9a-f]{64}$/),
  })
  .strict();

export type NotificationRegistrationResult = z.infer<typeof notificationRegistrationResultSchema>;

const appointmentNotificationSchema = z.object({
  appointmentId: z
    .string()
    .trim()
    .min(1)
    .max(128)
    .regex(/^[A-Za-z0-9][A-Za-z0-9_-]*$/),
  type: z.literal('appointment_reminder'),
});

export function parseAppointmentNotification(data: unknown): string | null {
  const parsed = appointmentNotificationSchema.safeParse(data);
  return parsed.success ? parsed.data.appointmentId : null;
}
