import { type SendResponse } from 'firebase-admin/messaging';
import { ZodError } from 'zod';

export const NON_RETRYABLE_DELIVERY_CODES = new Set([
  'app/invalid-argument',
  'app/invalid-credential',
  'grpc/7',
  'grpc/16',
  'messaging/authentication-error',
  'messaging/invalid-apns-credentials',
  'messaging/invalid-argument',
  'messaging/invalid-data-payload-key',
  'messaging/invalid-options',
  'messaging/invalid-package-name',
  'messaging/invalid-payload',
  'messaging/invalid-recipient',
  'messaging/invalid-registration-token',
  'messaging/mismatched-credential',
  'messaging/payload-size-limit-exceeded',
  'messaging/registration-token-not-registered',
  'messaging/sender-id-mismatch',
  'messaging/third-party-auth-error',
  'permission-denied',
  'unauthenticated',
]);

export type DeliveryFailure = {
  code: string;
  retryable: boolean;
};

export function shouldDisableDeviceToken(response: SendResponse) {
  const code = response.error?.code;

  return (
    code === 'messaging/registration-token-not-registered' ||
    code === 'messaging/invalid-registration-token'
  );
}

export function classifyDeliveryError(error: unknown): DeliveryFailure {
  if (error instanceof ZodError) {
    return { code: 'invalid-document', retryable: false };
  }

  const code = readErrorCode(error);

  return { code, retryable: !NON_RETRYABLE_DELIVERY_CODES.has(code) };
}

export class ReminderDeliveryError extends Error {
  constructor(
    readonly code: string,
    readonly retryable: boolean,
  ) {
    super(`Appointment reminder delivery failed: ${code}`);
    this.name = 'ReminderDeliveryError';
  }
}

// Keep only short error codes; provider messages can echo request contents.
export function readErrorCode(error: unknown): string {
  if (typeof error === 'object' && error !== null && 'code' in error) {
    const code = (error as { code: unknown }).code;

    if (typeof code === 'string' && /^[a-z0-9/_.-]{1,64}$/i.test(code)) {
      return code;
    }

    if (typeof code === 'number' && Number.isInteger(code)) {
      return `grpc/${code}`;
    }
  }

  return 'unknown';
}
