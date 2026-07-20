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
    'Appointment changes need an internet connection. Your choices are saved on this device.',
  );
}

export function toAppointmentActionError(error: unknown) {
  if (error instanceof AppointmentActionError) {
    return error;
  }

  const code = readErrorCode(error);

  if (code.includes('unauthenticated')) {
    return new AppointmentActionError(
      'authentication',
      'Sign in again before managing appointments.',
    );
  }

  if (code.includes('already-exists')) {
    return new AppointmentActionError(
      'conflict',
      'That appointment changed. Refresh and try again.',
    );
  }

  if (code.includes('not-found')) {
    return new AppointmentActionError('not-found', 'That appointment is no longer available.');
  }

  if (code.includes('invalid-argument')) {
    return new AppointmentActionError('invalid', 'Review your appointment choices and try again.');
  }

  if (code.includes('failed-precondition')) {
    return new AppointmentActionError(
      'unavailable',
      'That appointment can no longer be changed. Choose another time or try again later.',
    );
  }

  if (code.includes('network') || code.includes('unavailable')) {
    return createOfflineAppointmentError();
  }

  return new AppointmentActionError(
    'unknown',
    'The appointment could not be updated. Your choices are saved; please retry.',
  );
}

function readErrorCode(error: unknown) {
  if (typeof error !== 'object' || error === null || !('code' in error)) {
    return '';
  }

  return typeof error.code === 'string' ? error.code.toLowerCase() : '';
}
