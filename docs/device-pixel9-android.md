# Pixel 9 Android Device Verification

> Verified: 2026-10-23
>
> Scope: Android release build on a physical phone, Explore Demo and
> onboarding in English and Arabic. iPhone testing is deferred by the owner.

## Setup

- Google Pixel 9, Android 17.
- Release APK of `36cabf5` (sha256 `06974d77…86ad5fd`), R8 on, signed with the
  debug key.
- Driven over wireless adb; the owner did the fingerprint, face, camera and
  permission taps.

## Passed

- Onboarding: switching English to Arabic reloads into right to left; the
  three steps and Welcome work; a relaunch skips onboarding.
- Demo home in Arabic, right to left, including the tabs.
- Booking: clinician profile, slot, details, review, confirmed (with a
  booking reference).
- Calendar permission is asked in context. Deny shows an inline sentence;
  allow shows "أُضيف إلى التقويم" and writes the event at the booked time
  (Asia/Dubai).
- Largest Android font size: nothing cut off (owner).
- Light mode.

## Findings

Fixes are in progress on branch `fix/device-findings`; none is on `master`
yet.

| ID     | Severity | Finding                                                                                                                                                  | Status          |
| ------ | -------- | -------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------- |
| HK-M1  | Medium   | Arabic weekday chips on the clinician profile break day names mid-word at normal text size                                                               | Fix in progress |
| HK-M2  | Medium   | Add to calendar writes silently into the first calendar of the first account (the phone has three Google accounts); the user can't pick or see which one | Fix in progress |
| HK-M3  | Medium   | After a reschedule the calendar event stays at the old time while the app still says it was added                                                        | Fix in progress |
| HK-M3b | Medium   | Cancelling an appointment leaves its calendar event in place                                                                                             | Fix in progress |
| HK-L1  | Low      | Arabic onboarding Appearance chip "Use device" shows only its first word, although the chip has room                                                     | Fix in progress |
| HK-L2  | Low      | Visit details shows the raw time zone id `Asia/Dubai` in Arabic, while the profile shows the localized name                                              | Fix in progress |

## Skipped

By the owner's choice, within the showcase scope:

- Offline guard in airplane mode.
- TalkBack.
- Notifications, which need a real Firebase account.

## Deferred

- iOS on a physical iPhone.
