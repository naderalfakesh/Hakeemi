import type { AvailabilityWindow } from './types';

export const DEFAULT_AVAILABILITY_WINDOW_DAYS = 14;
export const MAX_AVAILABILITY_WINDOW_DAYS = 31;

const BOOKING_LEAD_TIME_MS = 15 * 60 * 1_000;
const WINDOW_BUCKET_MS = 15 * 60 * 1_000;
const DAY_MS = 24 * 60 * 60 * 1_000;

export function createAvailabilityWindow(
  referenceDate = new Date(),
  numberOfDays = DEFAULT_AVAILABILITY_WINDOW_DAYS,
): AvailabilityWindow {
  if (
    !Number.isInteger(numberOfDays) ||
    numberOfDays < 1 ||
    numberOfDays > MAX_AVAILABILITY_WINDOW_DAYS
  ) {
    throw new Error(
      `Availability window must be between 1 and ${MAX_AVAILABILITY_WINDOW_DAYS} days.`,
    );
  }

  const earliestBookableTime = referenceDate.getTime() + BOOKING_LEAD_TIME_MS;
  const startsAt = Math.ceil(earliestBookableTime / WINDOW_BUCKET_MS) * WINDOW_BUCKET_MS;

  return {
    endsBefore: new Date(startsAt + numberOfDays * DAY_MS).toISOString(),
    startsAtOrAfter: new Date(startsAt).toISOString(),
  };
}

export function parseAvailabilityWindow(window: AvailabilityWindow) {
  const startsAtOrAfter = new Date(window.startsAtOrAfter);
  const endsBefore = new Date(window.endsBefore);
  const duration = endsBefore.getTime() - startsAtOrAfter.getTime();

  if (
    Number.isNaN(startsAtOrAfter.getTime()) ||
    Number.isNaN(endsBefore.getTime()) ||
    duration <= 0 ||
    duration > MAX_AVAILABILITY_WINDOW_DAYS * DAY_MS
  ) {
    throw new Error('Invalid availability window.');
  }

  return { endsBefore, startsAtOrAfter };
}
