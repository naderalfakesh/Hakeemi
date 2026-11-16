# Pixel 9 Android Device Verification

> Verified: 2026-10-23; re-verified: 2026-11-15 – 2026-11-16
>
> Scope: Android release build on a physical phone, Explore Demo and
> onboarding in English and Arabic. iPhone testing is deferred by the owner.

## Setup

- Google Pixel 9, Android 17.
- Initial pass (`2026-10-23`): Release APK of `36cabf5` (sha256 `06974d77…86ad5fd`), R8 on, signed with the debug key.
- Re-verification (`2026-11-15`): Release APK of `ab881bb` (`expo ~58.0.25`, `react-native 0.88.1`, `versionName 2.0.0`, `minSdk 24`, `targetSdk 36`), R8 on, signed with the debug key.
- Driven over wireless `adb` and `agent-device`.

## Passed

- Onboarding: switching English to Arabic reloads into right to left; the
  three steps and Welcome work; a relaunch skips onboarding; the `"حسب الجهاز"`
  ("Use device") appearance chip fits without clipping (`HK-L1`).
- Welcome (`2026-11-15`): `"Explore the demo"` is foregrounded alongside `"Create account"` and `"Sign in"`.
- Demo home, Find care, Clinician profile, and Profile (`2026-11-15`): verified in Light and Dark mode, English LTR and Arabic RTL, including the Next Visit card, Specialty quick-chips, Saved clinicians bookmarking in Demo Mode, inline sticky booking footer (`Continue with ...`), and single-letter Arabic weekday headers (`HK-M1`).
- Booking: clinician profile, slot, details, review, confirmed (with a
  booking reference).
- Calendar & Visit details (`2026-11-15`):
  - Localized time zone name (`توقيت الخليج`) instead of raw `Asia/Dubai` (`HK-L2`).
  - Calendar permission is asked in context (`Deny` shows an inline message; with access granted, `"إضافة إلى التقويم"` opens a calendar chooser across multiple Google accounts and displays the chosen calendar name (`HK-M2`)).
  - Rescheduling moves the linked calendar event and reports `"نُقل إلى الوقت الجديد في <calendar>."` (`HK-M3`).
  - Cancelling removes the linked calendar event and reports `"أُزيل من <calendar>."` (`HK-M3b`).
- Play Protect (`2026-11-15`): `com.naderalfakesh.hakeemi` targets `targetSdk=36` (`minSdk=24`) and installs without older-Android warnings (an earlier prompt on the device came from the external `com.android.cli.interact.instrumentation` helper APK, not Hakeemi).
- Calendar permission denial (`2026-11-16`): declining calendar access from Visit details renders `"Calendar access was declined. You can still manage this appointment here."` inline while keeping Reschedule and Cancel interactive.
- Landscape rotation (`2026-11-16`): Home, Find care, and Provider profile remain scrollable in landscape with the header actions and sticky booking CTA accessible.
- End-to-end suite (`2026-11-16`): `npx e2e run --target android --retries 0 --action-timeout 15000` passed **3/3** on the Pixel 9 (`22.24s`), matching **3/3** on `--target web` (`10.28s`).
- Largest Android font size: nothing cut off (owner).

## Findings

All six findings from the 2026-10-23 pass were fixed on `master` and verified on the Pixel 9 (`2026-11-15`):

| ID     | Severity | Finding                                                                                                                                                 | Status |
| ------ | -------- | ------------------------------------------------------------------------------------------------------------------------------------------------------- | ------ |
| HK-M1  | Medium   | Arabic weekday chips on the clinician profile use single-letter CLDR narrow labels (`ن`, `ث`, `ر`, `خ`, `ج`, `س`, `ح`) and reflow at `fontScale >= 1.3` | Fixed  |
| HK-M2  | Medium   | Add to calendar opens a chooser when multiple writable calendars exist and displays the chosen calendar/account name                                    | Fixed  |
| HK-M3  | Medium   | Rescheduling an appointment updates its linked calendar event to the new slot time and reports the target calendar                                      | Fixed  |
| HK-M3b | Medium   | Cancelling an appointment deletes its linked calendar event and reports the removal                                                                     | Fixed  |
| HK-L1  | Low      | Arabic RTL `AppText` zeroes `letterSpacing` and `Chip` allows wrapping so `"حسب الجهاز"` ("Use device") renders without clipping                        | Fixed  |
| HK-L2  | Low      | Visit details and cards format time zone names with `Intl.DateTimeFormat` (`توقيت الخليج` / `Gulf Standard Time`) instead of raw IANA `Asia/Dubai`      | Fixed  |

## Performance & bundle baseline

Measured `2026-11-16` with `npx expo export` (`preview` env, Hermes bytecode enabled) and on the Pixel 9:

- Cold start (`am start -W`, `LaunchState: COLD`, 3 runs): `TotalTime` `398 ms`, `301 ms`, `302 ms` (median `302 ms`)
- Installed Release APK on Pixel 9 (`base.apk`, R8 enabled): `92 MB`
- Android Hermes bundle (`_expo/static/js/android/entry-*.hbc`): `6 MB` (`5.8 MB` on disk, `2004` modules)
- iOS Hermes bundle (`_expo/static/js/ios/entry-*.hbc`): `6.1 MB` (`5.8 MB` on disk, `2212` modules)
- Web static export (`23` routes, `26` JS bundles): `1.7 MB` shared chunk + `1.1 MB` entry + route chunks (`17 MB` total export directory with assets)

## Skipped

By the owner's choice, within the showcase scope:

- Offline guard in airplane mode (Wi-Fi stayed active for wireless `adb`).
- TalkBack.
- Notifications, which need a real Firebase account.

## Deferred

- iOS on a physical iPhone.
