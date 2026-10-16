import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import { Timestamp } from 'firebase-admin/firestore';
import { z } from 'zod';

import {
  APPOINTMENT_REMINDER_LEAD_TIME_MS,
  APPOINTMENT_REMINDER_MAX_ATTEMPTS,
  APPOINTMENT_REMINDER_RETRY_LOOKBACK_MS,
  APPOINTMENT_REMINDER_WINDOW_MS,
  buildAppointmentReminderMessage,
  classifyDeliveryError,
  deriveReminderId,
  getAppointmentReminderWindow,
  resolveReminderLocale,
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

  it('uses generic Arabic copy for Arabic devices and keeps the payload identical', () => {
    const arabic = buildAppointmentReminderMessage(['token-1'], 'appointment-1', 'ar');
    const english = buildAppointmentReminderMessage(['token-1'], 'appointment-1', 'en');

    assert.deepEqual(arabic.notification, {
      body: 'لديك موعد قادم في «حكيمي».',
      title: 'تذكير بالموعد',
    });
    assert.deepEqual(arabic.data, english.data);
    assert.deepEqual(arabic.android, english.android);
    assert.deepEqual(arabic.apns, english.apns);

    for (const message of [arabic, english]) {
      const copy = `${message.notification?.title} ${message.notification?.body}`;

      assert.match(copy, /^[^@]+$/);
      assert.doesNotMatch(copy, /token|appointment-1|clinic|doctor|dr\.|\d/i);
    }
  });

  it('resolves Arabic locale variants and falls back to English', () => {
    assert.equal(resolveReminderLocale('ar'), 'ar');
    assert.equal(resolveReminderLocale('ar-SA'), 'ar');
    assert.equal(resolveReminderLocale('AR_EG'), 'ar');
    assert.equal(resolveReminderLocale(' ar '), 'ar');
    assert.equal(resolveReminderLocale('arn'), 'en');
    assert.equal(resolveReminderLocale('en'), 'en');
    assert.equal(resolveReminderLocale('fr'), 'en');
    assert.equal(resolveReminderLocale(undefined), 'en');
    assert.equal(resolveReminderLocale(42), 'en');
  });

  it('creates a centered 15-minute window around the 24-hour reminder target', () => {
    const now = Timestamp.fromMillis(1_700_000_000_000);
    const window = getAppointmentReminderWindow(now);
    const target = now.toMillis() + APPOINTMENT_REMINDER_LEAD_TIME_MS;

    assert.equal(window.end.toMillis() - window.start.toMillis(), APPOINTMENT_REMINDER_WINDOW_MS);
    assert.equal(window.start.toMillis(), target - APPOINTMENT_REMINDER_WINDOW_MS / 2);
    assert.equal(window.end.toMillis(), target + APPOINTMENT_REMINDER_WINDOW_MS / 2);
  });

  it('bounds retries to three attempts inside a 48-hour lookback', () => {
    assert.equal(APPOINTMENT_REMINDER_MAX_ATTEMPTS, 3);
    assert.equal(APPOINTMENT_REMINDER_RETRY_LOOKBACK_MS, 48 * 60 * 60 * 1_000);
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

  it('retries transient delivery errors but not credential, argument, or data errors', () => {
    assert.deepEqual(classifyDeliveryError({ code: 'messaging/internal-error' }), {
      code: 'messaging/internal-error',
      retryable: true,
    });
    assert.deepEqual(classifyDeliveryError({ code: 'messaging/server-unavailable' }), {
      code: 'messaging/server-unavailable',
      retryable: true,
    });
    assert.deepEqual(classifyDeliveryError({ code: 14 }), { code: 'grpc/14', retryable: true });
    assert.deepEqual(classifyDeliveryError(new Error('socket hang up')), {
      code: 'unknown',
      retryable: true,
    });

    for (const code of [
      'messaging/third-party-auth-error',
      'messaging/authentication-error',
      'messaging/mismatched-credential',
      'messaging/sender-id-mismatch',
      'messaging/invalid-argument',
      'app/invalid-credential',
      'permission-denied',
      'unauthenticated',
    ]) {
      assert.deepEqual(classifyDeliveryError({ code }), { code, retryable: false });
    }

    // Firestore PERMISSION_DENIED and UNAUTHENTICATED arrive as gRPC status numbers.
    assert.deepEqual(classifyDeliveryError({ code: 7 }), { code: 'grpc/7', retryable: false });
    assert.deepEqual(classifyDeliveryError({ code: 16 }), { code: 'grpc/16', retryable: false });

    const zodFailure = z.object({ startsAt: z.number() }).safeParse({ startsAt: 'later' });
    assert.equal(zodFailure.success, false);
    assert.deepEqual(classifyDeliveryError(zodFailure.error), {
      code: 'invalid-document',
      retryable: false,
    });
  });

  it('never surfaces free-form error text or oversized codes as an error code', () => {
    const token = 'fcm-token-that-must-never-leak-0123456789';

    assert.deepEqual(classifyDeliveryError({ code: `bad token ${token}`, message: token }), {
      code: 'unknown',
      retryable: true,
    });
    assert.deepEqual(classifyDeliveryError({ code: 'x'.repeat(65) }), {
      code: 'unknown',
      retryable: true,
    });
  });
});
