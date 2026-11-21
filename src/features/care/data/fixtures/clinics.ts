import type { Clinic } from '../../domain/types';

export const clinicFixtures = [
  {
    id: 'marsa-family-clinic',
    name: { en: 'Marsa Family Clinic', ar: 'عيادة مرسى للأسرة' },
    address: { en: 'Harbour Walk, Dubai Marina', ar: 'ممشى الميناء، دبي مارينا' },
    city: { en: 'Dubai', ar: 'دبي' },
    timezone: 'Asia/Dubai',
    isActive: true,
  },
  {
    id: 'barari-medical-centre',
    name: { en: 'Barari Medical Centre', ar: 'مركز البراري الطبي' },
    address: { en: 'Green Avenue, Al Barari', ar: 'الجادة الخضراء، البراري' },
    city: { en: 'Dubai', ar: 'دبي' },
    timezone: 'Asia/Dubai',
    isActive: true,
  },
  {
    id: 'harbour-telehealth',
    name: { en: 'Harbour Telehealth', ar: 'هاربور للرعاية عن بُعد' },
    address: { en: 'Video visits across the UAE', ar: 'زيارات فيديو في جميع أنحاء الإمارات' },
    city: { en: 'Online', ar: 'عبر الإنترنت' },
    timezone: 'Asia/Dubai',
    isActive: true,
  },
] as const satisfies readonly Clinic[];
