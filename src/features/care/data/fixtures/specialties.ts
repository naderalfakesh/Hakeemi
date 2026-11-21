import type { Specialty } from '../../domain/types';

export const specialtyFixtures = [
  {
    id: 'family-medicine',
    name: { en: 'Family medicine', ar: 'طب الأسرة' },
    description: {
      en: 'Everyday care, prevention, and ongoing health support.',
      ar: 'الرعاية اليومية والوقاية والدعم الصحي المستمر.',
    },
    icon: 'medkit-outline',
    sortOrder: 1,
    isActive: true,
  },
  {
    id: 'cardiology',
    name: { en: 'Cardiology', ar: 'طب القلب' },
    description: {
      en: 'Heart health, prevention, diagnosis, and follow-up care.',
      ar: 'صحة القلب والوقاية والتشخيص والرعاية المستمرة.',
    },
    icon: 'heart-outline',
    sortOrder: 2,
    isActive: true,
  },
  {
    id: 'dermatology',
    name: { en: 'Dermatology', ar: 'الأمراض الجلدية' },
    description: {
      en: 'Care for skin, hair, and nail concerns.',
      ar: 'رعاية مشكلات البشرة والشعر والأظافر.',
    },
    icon: 'sparkles-outline',
    sortOrder: 3,
    isActive: true,
  },
  {
    id: 'pediatrics',
    name: { en: 'Pediatrics', ar: 'طب الأطفال' },
    description: {
      en: 'Thoughtful care for infants, children, and teenagers.',
      ar: 'رعاية متخصصة للرضّع والأطفال والمراهقين.',
    },
    icon: 'happy-outline',
    sortOrder: 4,
    isActive: true,
  },
  {
    id: 'mental-wellbeing',
    name: { en: 'Mental wellbeing', ar: 'الصحة النفسية' },
    description: {
      en: 'Confidential support for emotional and mental wellbeing.',
      ar: 'دعم سري للصحة النفسية والعاطفية.',
    },
    icon: 'chatbubbles-outline',
    sortOrder: 5,
    isActive: true,
  },
  {
    id: 'womens-health',
    name: { en: "Women's health", ar: 'صحة المرأة' },
    description: {
      en: 'Preventive, reproductive, and ongoing health care.',
      ar: 'الرعاية الوقائية والإنجابية والصحية المستمرة.',
    },
    icon: 'flower-outline',
    sortOrder: 6,
    isActive: true,
  },
] as const satisfies readonly Specialty[];
