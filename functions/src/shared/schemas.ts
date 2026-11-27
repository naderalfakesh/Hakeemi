import { Timestamp } from 'firebase-admin/firestore';
import { z } from 'zod';

export const VISIT_MODES = ['in_person', 'video'] as const;
export const NOTIFICATION_PLATFORMS = ['android', 'ios'] as const;
export const SUPPORTED_LOCALES = ['ar', 'en'] as const;

export const documentIdSchema = z
  .string()
  .trim()
  .min(1)
  .max(128)
  .regex(/^[A-Za-z0-9][A-Za-z0-9_-]*$/);

export const requestIdSchema = z
  .string()
  .trim()
  .regex(/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i);

export const timestampSchema = z.custom<Timestamp>((value) => value instanceof Timestamp);
