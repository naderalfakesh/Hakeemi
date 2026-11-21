import { useEffect, useMemo, useState } from 'react';

import type { AvailabilitySlot, AvailabilityWindow } from '../domain/types';
import {
  buildAvailabilityCalendarDays,
  type AvailabilityCalendarDay,
} from '../presentation/availability-calendar-days';

type UseAvailabilitySelectionOptions = {
  availabilityWindow: AvailabilityWindow;
  onSelectedSlotChange?: ((slot: AvailabilitySlot | null) => void) | undefined;
  slots: readonly AvailabilitySlot[];
};

export function useAvailabilitySelection({
  availabilityWindow,
  onSelectedSlotChange,
  slots,
}: UseAvailabilitySelectionOptions) {
  const timezone = slots[0]?.timezone ?? 'Asia/Dubai';
  const days = useMemo(
    () => buildAvailabilityCalendarDays(availabilityWindow, timezone, slots),
    [availabilityWindow, slots, timezone],
  );
  const firstAvailableDay = days.find((day) => day.slots.length > 0) ?? null;
  const [selectedDateKey, setSelectedDateKey] = useState(firstAvailableDay?.dateKey ?? null);
  const selectedDay =
    days.find((day) => day.dateKey === selectedDateKey && day.slots.length > 0) ??
    firstAvailableDay;
  const [selectedSlotId, setSelectedSlotId] = useState(selectedDay?.slots[0]?.id ?? null);
  const selectedSlot =
    selectedDay?.slots.find((slot) => slot.id === selectedSlotId) ?? selectedDay?.slots[0] ?? null;
  const activeDay = selectedDay ?? firstAvailableDay;

  useEffect(() => {
    onSelectedSlotChange?.(selectedSlot);
  }, [onSelectedSlotChange, selectedSlot]);

  const selectDay = (day: AvailabilityCalendarDay) => {
    setSelectedDateKey(day.dateKey);
    setSelectedSlotId(day.slots[0]?.id ?? null);
  };
  const selectSlot = (slotId: string) => setSelectedSlotId(slotId);

  return { days, activeDay, selectedSlot, selectDay, selectSlot };
}
