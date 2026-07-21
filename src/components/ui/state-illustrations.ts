/**
 * Shared spot illustrations for empty, error, offline, and success moments.
 * Keyed by meaning so screens stay declarative about intent.
 */
export const stateIllustrations = {
  bookingConfirmed: require('../../../assets/illustrations/state-booking-confirmed.webp'),
  error: require('../../../assets/illustrations/state-error.webp'),
  noAppointments: require('../../../assets/illustrations/state-no-appointments.webp'),
  noResults: require('../../../assets/illustrations/state-no-results.webp'),
  noSaved: require('../../../assets/illustrations/state-no-saved.webp'),
  offline: require('../../../assets/illustrations/state-offline.webp'),
} as const;
