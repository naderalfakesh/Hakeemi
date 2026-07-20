import type { LocalizedStrings } from '@/localization/use-strings';

import type { AppointmentStatus, VisitMode } from '../domain/types';

type AppointmentStatusStrings = {
  statusLabels: Record<AppointmentStatus, string>;
  visitModeLabels: Record<VisitMode, string>;
};

const en: AppointmentStatusStrings = {
  statusLabels: {
    cancelled: 'CANCELLED',
    completed: 'COMPLETED',
    confirmed: 'CONFIRMED',
    no_show: 'NO SHOW',
  },
  visitModeLabels: {
    in_person: 'In-person visit',
    video: 'Video visit',
  },
};

export const appointmentStatusStrings: LocalizedStrings<AppointmentStatusStrings> = {
  ar: {
    statusLabels: {
      cancelled: 'ملغى',
      completed: 'مكتمل',
      confirmed: 'مؤكد',
      no_show: 'لم يحضر',
    },
    visitModeLabels: {
      in_person: 'زيارة حضورية',
      video: 'زيارة عبر الفيديو',
    },
  },
  en,
};
