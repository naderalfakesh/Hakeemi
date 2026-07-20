import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import { Timestamp } from 'firebase-admin/firestore';

import {
  APPOINTMENT_REMINDER_LEAD_TIME_MS,
  APPOINTMENT_REMINDER_WINDOW_MS,
  buildAppointmentReminderMessage,
  deriveReminderId,
  getAppointmentReminderWindow,
  shouldDisableDeviceToken,
} from './send-appointment-reminders.js';

describe('appointment reminder delivery', () => {
  it('builds a privacy-safe deep-link payload without appointment details', () => {
    const message = buildAppointmentReminderMessage(['token-1'], 'appointment-1');

    assert.deepEqual(message.data, {
      appointmentId: 'appointment-1',
      type: 'appointment_reminder',
    });
    assert.deepEqual(message.notification, {
      body: 'You have a Hakeemi appointment coming up.',
      title: 'Appointment reminder',
    });
    assert.equal(
      Object.keys(message.data ?? {})
        .sort()
        .join(','),
      'appointmentId,type',
    );
    assert.equal(message.tokens?.[0], 'token-1');
  });

  it('creates a centered 15-minute window around the 24-hour reminder target', () => {
    const now = Timestamp.fromMillis(1_700_000_000_000);
    const window = getAppointmentReminderWindow(now);
    const target = now.toMillis() + APPOINTMENT_REMINDER_LEAD_TIME_MS;

    assert.equal(window.end.toMillis() - window.start.toMillis(), APPOINTMENT_REMINDER_WINDOW_MS);
    assert.equal(window.start.toMillis(), target - APPOINTMENT_REMINDER_WINDOW_MS / 2);
    assert.equal(window.end.toMillis(), target + APPOINTMENT_REMINDER_WINDOW_MS / 2);
  });

  it('uses a stable opaque receipt ID and disables only invalid registration tokens', () => {
    assert.equal(deriveReminderId('appointment-1'), deriveReminderId('appointment-1'));
    assert.notEqual(deriveReminderId('appointment-1'), deriveReminderId('appointment-2'));
    assert.equal(
      shouldDisableDeviceToken({
        success: false,
        error: { code: 'messaging/registration-token-not-registered' } as never,
      }),
      true,
    );
    assert.equal(
      shouldDisableDeviceToken({
        success: false,
        error: { code: 'messaging/internal-error' } as never,
      }),
      false,
    );
  });
});
