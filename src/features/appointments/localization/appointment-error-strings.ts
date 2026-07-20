import type { AppLocale } from '@/localization/locale-provider';
import type { LocalizedStrings } from '@/localization/use-strings';

import type { AppointmentFailureCode } from '../domain/errors';
import { AppointmentActionError } from '../domain/errors';

const appointmentErrorStrings: LocalizedStrings<Record<AppointmentFailureCode, string>> = {
  ar: {
    authentication: 'سجّل الدخول مرة أخرى قبل إدارة المواعيد.',
    conflict: 'تغيّر هذا الموعد. حدّث البيانات وحاول مرة أخرى.',
    invalid: 'راجع خيارات موعدك وحاول مرة أخرى.',
    network: 'تتطلب تعديلات المواعيد اتصالًا بالإنترنت. خياراتك محفوظة على هذا الجهاز.',
    'not-found': 'هذا الموعد لم يعد متاحًا.',
    unavailable: 'لم يعد بالإمكان تغيير هذا الموعد. اختر وقتًا آخر أو حاول لاحقًا.',
    unknown: 'تعذّر تحديث الموعد. خياراتك محفوظة؛ يرجى المحاولة مرة أخرى.',
  },
  en: {
    authentication: 'Sign in again before managing appointments.',
    conflict: 'That appointment changed. Refresh and try again.',
    invalid: 'Review your appointment choices and try again.',
    network:
      'Appointment changes need an internet connection. Your choices are saved on this device.',
    'not-found': 'That appointment is no longer available.',
    unavailable:
      'That appointment can no longer be changed. Choose another time or try again later.',
    unknown: 'The appointment could not be updated. Your choices are saved; please retry.',
  },
};

export function localizeAppointmentError(error: unknown, locale: AppLocale): string {
  const code: AppointmentFailureCode =
    error instanceof AppointmentActionError ? error.code : 'unknown';

  return appointmentErrorStrings[locale][code];
}
