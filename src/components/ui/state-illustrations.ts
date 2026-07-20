/**
 * Shared spot illustrations for empty, error, offline, and success moments.
 * Keyed by meaning so screens stay declarative about intent.
 */
export const stateIllustrations = {
  bookingConfirmed: require('../../../assets/illustrations/state-booking-confirmed.png'),
  error: require('../../../assets/illustrations/state-error.png'),
  noAppointments: require('../../../assets/illustrations/state-no-appointments.png'),
  noResults: require('../../../assets/illustrations/state-no-results.png'),
  noSaved: require('../../../assets/illustrations/state-no-saved.png'),
  offline: require('../../../assets/illustrations/state-offline.png'),
} as const;
