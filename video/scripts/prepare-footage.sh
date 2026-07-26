#!/usr/bin/env bash
# Cuts the raw simulator recordings (recordings/*.mov, gitignored) into the
# trimmed, normalized segments the Remotion compositions expect, and copies the
# brand assets the video uses from the app repo.
#
# The raw captures are variable-frame-rate (the simulator only wrote frames
# when the screen changed), which makes input-side seeking (-ss before -i)
# unreliable: it lands on sparse keyframes and produces segments with long
# frozen leads. So we seek on the OUTPUT side: `fps=30` first materializes a
# constant-frame-rate timeline (gaps become held frames, which is exactly what
# a static screen should look like), then -ss/-t cut an exact window. The
# clips only contain a few hundred real frames, so decoding from zero is cheap.
#
# The iOS status bar (inconsistent clock, Dynamic Island) is cropped off the
# top: 1320x2868 -> 1320x2708.
#
# Usage: ./scripts/prepare-footage.sh [path-to-recordings-dir]
set -euo pipefail

REC_DIR="${1:-$(cd "$(dirname "$0")/../.." && pwd)/recordings}"
OUT_DIR="$(cd "$(dirname "$0")/.." && pwd)/public/footage"
mkdir -p "$OUT_DIR"

cut() { # cut <src-clip> <start> <duration> <out-name>
  local src="$1" start="$2" dur="$3" name="$4"
  echo "-> $name (${src} @ ${start}s +${dur}s)"
  ffmpeg -hide_banner -loglevel error -i "$REC_DIR/$src" \
    -ss "$start" -t "$dur" \
    -vf "fps=30,crop=1320:2708:0:160" -an \
    -c:v libx264 -preset medium -crf 17 -pix_fmt yuv420p \
    -y "$OUT_DIR/$name.mp4"
}

# For states that only exist as a single held frame in the capture, a PNG
# still is simpler than a video segment.
still() { # still <src-clip> <time> <out-name>
  local src="$1" t="$2" name="$3"
  echo "-> $name.png (${src} @ ${t}s)"
  ffmpeg -hide_banner -loglevel error -ss "$t" -i "$REC_DIR/$src" \
    -frames:v 1 -vf "crop=1320:2708:0:160" -y "$OUT_DIR/$name.png"
}

# ---- 00: welcome ----------------------------------------------------------
cut 00-onboarding-welcome.mov  87.6  1.9  welcome-to-home    # welcome hold, tap "Explore the demo", real nav to Home

# ---- 01: discovery --------------------------------------------------------
cut 01-discovery.mov           18.4  2.8  home-scroll        # illustrated Home scroll
cut 01-discovery.mov           48.6  1.9  findcare-open      # tap Home hero -> Find care
cut 01-discovery.mov          124.6  2.0  profile-open       # tap Dr. Aisha card, push animation
cut 01-discovery.mov          140.2  3.4  profile-scroll     # profile scroll: calendar, about

# ---- 02: booking ----------------------------------------------------------
cut 02-booking.mov             13.2  1.6  pick-day           # tap Wed 5
cut 02-booking.mov             16.1  1.5  pick-slot          # tap 4:00 PM
cut 02-booking.mov             59.7  1.9  to-visit-details   # sticky Continue -> step 1 of 2
cut 02-booking.mov             76.1  1.4  reason-chip        # tap "Routine visit"
cut 02-booking.mov            122.8  1.7  to-review          # Review appointment -> step 2 of 2
cut 02-booking.mov            136.2  1.2  confirm-press      # tap Confirm appointment
cut 02-booking.mov            164.05 2.5  confirmation       # mascot + "Appointment confirmed"
cut 02-booking.mov            216.6  0.95 view-appts         # View appointments -> list

# ---- 03: manage -----------------------------------------------------------
cut 03-manage-appointment.mov  79.0  1.6  appt-open          # open the 5 Aug appointment
cut 03-manage-appointment.mov  92.6  1.4  resched-open       # tap Reschedule -> inline calendar
cut 03-manage-appointment.mov 142.6  1.6  resched-pick-day   # tap Fri 7
cut 03-manage-appointment.mov 156.2  2.0  resched-scroll     # scroll to time slots
cut 03-manage-appointment.mov 178.9  1.5  resched-pick-slot  # tap 2:00 PM
cut 03-manage-appointment.mov 199.4  1.6  resched-done       # confirmed: Fri 7 Aug, 2:00 PM
still 03-manage-appointment.mov 250  cancel-red              # focused cancel confirm (single red action)
still 03-manage-appointment.mov 285  cancel-done             # CANCELLED badge + note

# ---- 04: Arabic / RTL -----------------------------------------------------
cut 04-arabic-rtl-switch.mov    5.0  0.5  lang-pre           # settled EN profile (freeze-extended)
cut 04-arabic-rtl-switch.mov   12.5  4.3  lang-switch        # tap العربية -> app restarts into RTL onboarding
cut 04-arabic-rtl-switch.mov  116.3  1.5  ar-welcome         # Arabic welcome screen
cut 04-arabic-rtl-switch.mov  157.1  1.7  ar-findcare        # Find care, mirrored layout
cut 04-arabic-rtl-switch.mov  185.2  2.9  ar-profile-scroll  # Arabic provider profile scroll

# ---- 05: dark mode --------------------------------------------------------
cut 05-dark-mode.mov          159.3  3.1  dark-pre           # light AR profile hold, tap داكن -> flips dark in place
still 05-dark-mode.mov        235        dark-profile        # settled dark profile (hold)
cut 05-dark-mode.mov          185.3  2.0  dark-home-scroll   # dark Home scroll

echo "All segments written to $OUT_DIR"
