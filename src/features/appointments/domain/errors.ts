export type AppointmentFailureCode =
  'authentication' | 'conflict' | 'invalid' | 'network' | 'not-found' | 'unavailable' | 'unknown';

export class AppointmentActionError extends Error {
  public constructor(
    public readonly code: AppointmentFailureCode,
    message: string,
  ) {
    super(message);
    this.name = 'AppointmentActionError';
  }
}

export function createOfflineAppointmentError() {
  return new AppointmentActionError(
    'network',
    'Booking needs an internet connection. Your choices are saved on this device.',
  );
}

export function toAppointmentActionError(error: unknown) {
  if (error instanceof AppointmentActionError) {
    return error;
  }

  const code = readErrorCode(error);

  if (code.includes('unauthenticated')) {
    return new AppointmentActionError('authentication', 'Sign in again before booking.');
  }

  if (code.includes('already-exists')) {
    return new AppointmentActionError(
      'conflict',
      'That time was just booked. Return to the provider and choose another.',
    );
  }

  if (code.includes('not-found')) {
    return new AppointmentActionError('not-found', 'That appointment time no longer exists.');
  }

  if (code.includes('invalid-argument')) {
    return new AppointmentActionError('invalid', 'Review your booking choices and try again.');
  }

  if (code.includes('failed-precondition')) {
    return new AppointmentActionError(
      'unavailable',
      'That appointment can no longer be booked. Choose another time.',
    );
  }

  if (code.includes('network') || code.includes('unavailable')) {
    return createOfflineAppointmentError();
  }

  return new AppointmentActionError(
    'unknown',
    'The appointment could not be confirmed. Your choices are saved; please retry.',
  );
}

function readErrorCode(error: unknown) {
  if (typeof error !== 'object' || error === null || !('code' in error)) {
    return '';
  }

  return typeof error.code === 'string' ? error.code.toLowerCase() : '';
}
