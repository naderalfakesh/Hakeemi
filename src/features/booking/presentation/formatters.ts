import type { AppointmentReasonCategory } from '@/features/appointments/domain/types';
import type { AvailabilitySlot } from '@/features/care/domain/types';
import { formatAvailability, formatVisitMode } from '@/features/care/presentation/formatters';

export const reasonCategoryOptions: readonly {
  label: string;
  value: AppointmentReasonCategory | null;
}[] = [
  { label: 'Routine visit', value: 'routine_visit' },
  { label: 'New concern', value: 'new_concern' },
  { label: 'Follow-up', value: 'follow_up' },
  { label: 'Preventive care', value: 'preventive_care' },
  { label: 'Another reason', value: 'other' },
  { label: 'Prefer not to say', value: null },
];

export function formatReasonCategory(category: AppointmentReasonCategory | null) {
  return reasonCategoryOptions.find((option) => option.value === category)?.label ?? 'Not provided';
}

export function formatBookingSlot(slot: AvailabilitySlot) {
  return `${formatAvailability(slot)} · ${formatVisitMode(slot.visitMode)}`;
}
