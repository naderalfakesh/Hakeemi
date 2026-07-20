import type { LocalizedStrings } from '@/localization/use-strings';

const en = {
  backLabel: 'Back',
  confirmation: {
    confirmedProviderFallback: 'Confirmed provider',
    findAnotherClinician: 'Find another clinician',
    inPersonVisit: 'In-person visit',
    reference: (code: string) => `Reference ${code}`,
    subtitle: 'Your time is reserved and available from the Appointments tab.',
    title: 'Appointment confirmed',
    videoVisit: 'Video visit',
    viewAppointments: 'View appointments',
    visitMeta: (visitLabel: string, timezone: string) => `${visitLabel} · ${timezone}`,
  },
  details: {
    reasonHelp: 'Choose a broad category only. Hakeemi does not collect symptoms or medical notes.',
    reasonQuestion: 'What is this visit for?',
    reviewAppointment: 'Review appointment',
    subtitle: 'Your selected appointment is held only when you confirm on the next screen.',
    title: 'Visit details',
  },
  draftErrors: {
    'restore-failed': 'A previous booking draft could not be restored.',
    'save-failed': 'Your booking choices could not be saved on this device.',
  },
  review: {
    confirmAppointment: 'Confirm appointment',
    confirmAppointmentHint: 'Reserves the selected time through a secure transaction.',
    disclaimer:
      'Portfolio demonstration only. This creates an appointment against fictional provider data.',
    offlineBody: 'Your choices are saved. Reconnect before confirming; bookings are never queued.',
    offlineTitle: 'You are offline',
    subtitle: 'Nothing is booked until the secure transaction succeeds.',
    title: 'Review and confirm',
  },
  routeState: {
    chooseAnotherTime: 'Choose another time',
    errorDescription: 'The provider and appointment time could not be loaded.',
    errorTitle: 'Booking could not be loaded',
    loadingLabel: 'Loading booking',
    notFoundDescription:
      'This appointment time is no longer available in the current booking window.',
    tryAgain: 'Try again',
  },
  stepOf: (step: number, total: number) => `STEP ${step} OF ${total}`,
  summary: {
    appointment: 'Appointment',
    clinic: 'Clinic',
    clinician: 'Clinician',
    consultation: 'Consultation',
    timezone: (timezone: string) => `Timezone: ${timezone}`,
    videoVisit: 'Video visit',
    visitCategory: 'Visit category',
    visitMode: 'Visit mode',
  },
};

export const bookingStrings: LocalizedStrings<typeof en> = {
  ar: {
    backLabel: 'رجوع',
    confirmation: {
      confirmedProviderFallback: 'مقدم الرعاية المؤكد',
      findAnotherClinician: 'البحث عن طبيب آخر',
      inPersonVisit: 'زيارة حضورية',
      reference: (code) => `الرقم المرجعي ${code}`,
      subtitle: 'تم حجز وقتك، ويمكنك الاطلاع عليه من تبويب المواعيد.',
      title: 'تم تأكيد الموعد',
      videoVisit: 'زيارة عبر الفيديو',
      viewAppointments: 'عرض المواعيد',
      visitMeta: (visitLabel, timezone) => `${visitLabel} · ${timezone}`,
    },
    details: {
      reasonHelp: 'اختر فئة عامة فقط، فتطبيق «حكيمي» لا يجمع الأعراض أو الملاحظات الطبية.',
      reasonQuestion: 'ما سبب هذه الزيارة؟',
      reviewAppointment: 'مراجعة الموعد',
      subtitle: 'موعدك المحدد لا يُحجز إلا عندما تؤكده في الشاشة التالية.',
      title: 'تفاصيل الزيارة',
    },
    draftErrors: {
      'restore-failed': 'تعذّرت استعادة مسودة حجز سابقة.',
      'save-failed': 'تعذّر حفظ خيارات حجزك على هذا الجهاز.',
    },
    review: {
      confirmAppointment: 'تأكيد الموعد',
      confirmAppointmentHint: 'يحجز الوقت المحدد عبر معاملة آمنة.',
      disclaimer:
        'عرض توضيحي لأغراض معرض الأعمال فقط، وينشئ هذا الإجراء موعدًا باستخدام بيانات مقدمي رعاية خياليين.',
      offlineBody:
        'خياراتك محفوظة. أعد الاتصال بالإنترنت قبل التأكيد؛ فالحجوزات لا تُوضع في قائمة انتظار أبدًا.',
      offlineTitle: 'أنت غير متصل بالإنترنت',
      subtitle: 'لن يُحجز أي موعد حتى تكتمل المعاملة الآمنة بنجاح.',
      title: 'المراجعة والتأكيد',
    },
    routeState: {
      chooseAnotherTime: 'اختر وقتًا آخر',
      errorDescription: 'تعذّر تحميل بيانات مقدم الرعاية ووقت الموعد.',
      errorTitle: 'تعذّر تحميل الحجز',
      loadingLabel: 'جارٍ تحميل الحجز',
      notFoundDescription: 'لم يعد وقت هذا الموعد متاحًا ضمن نافذة الحجز الحالية.',
      tryAgain: 'حاول مرة أخرى',
    },
    stepOf: (step, total) => `الخطوة ${step} من ${total}`,
    summary: {
      appointment: 'الموعد',
      clinic: 'العيادة',
      clinician: 'الطبيب',
      consultation: 'الاستشارة',
      timezone: (timezone) => `المنطقة الزمنية: ${timezone}`,
      videoVisit: 'زيارة عبر الفيديو',
      visitCategory: 'فئة الزيارة',
      visitMode: 'نوع الزيارة',
    },
  },
  en,
};
