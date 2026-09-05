import React from "react";
import { Sequence } from "remotion";
import { Audio } from "@remotion/media";
import { ding, uiSwitch } from "@remotion/sfx";
import type { Beat} from "../components/BeatTrack";
import { BeatTrack, trackFrames } from "../components/BeatTrack";
import { Caption } from "../components/Caption";
import { Chapter } from "../components/Chapter";
import { segments, DARK_FLIP_FRAME } from "../segments";
import { dark, light } from "../theme";

// ---------------------------------------------------------------------------
// Hello: phone rises in on the Welcome screen, tap "Explore the demo".
// ---------------------------------------------------------------------------

export const helloBeats: Beat[] = [
  { seg: segments.welcomeToHome, lead: 46, hold: 44 },
];
export const HELLO_FRAMES = trackFrames(helloBeats);

export const HelloScene: React.FC = () => (
  <Chapter
    phoneEnter
    mode="light"
    caption={
      <Caption
        palette={light}
        eyebrow="Portfolio demo"
        headline={
          <>
            A healthcare booking
            <br />
            experience, end to end
          </>
        }
        sub="React Native + Expo, TypeScript, Expo Router and native Firebase. Every clinician is fictional."
      />
    }
    phone={<BeatTrack beats={helloBeats} tapColor={light.brand} />}
  />
);

// ---------------------------------------------------------------------------
// Discover: Home scroll -> Find care -> provider profile.
// ---------------------------------------------------------------------------

export const discoverBeats: Beat[] = [
  { seg: segments.homeScroll, rate: 1.25, hold: 8 },
  { seg: segments.findcareOpen, lead: 8, hold: 14 },
  { seg: segments.profileOpen, lead: 8, hold: 4 },
  { seg: segments.profileScroll, rate: 1.1, hold: 22 },
];
export const DISCOVER_FRAMES = trackFrames(discoverBeats);

export const DiscoverScene: React.FC = () => (
  <Chapter
    mode="light"
    caption={
      <Caption
        palette={light}
        eyebrow="01 · Discover"
        headline={
          <>
            Find the right
            <br />
            clinician
          </>
        }
        sub="Search, specialty filters and real availability — served from Firebase, not hard-coded."
      />
    }
    phone={<BeatTrack beats={discoverBeats} tapColor={light.brand} />}
  />
);

// ---------------------------------------------------------------------------
// Book: day + slot -> visit details -> review -> confirmed.
// ---------------------------------------------------------------------------

export const bookBeats: Beat[] = [
  { seg: segments.pickDay, lead: 6, hold: 2 },
  { seg: segments.pickSlot, lead: 2, hold: 4 },
  { seg: segments.toVisitDetails, hold: 4 },
  { seg: segments.reasonChip, lead: 2, hold: 4 },
  { seg: segments.toReview, hold: 6 },
  { seg: segments.confirmPress, hold: 8 },
  { seg: segments.confirmation, hold: 16 },
  { seg: segments.viewAppts, lead: 4, hold: 8 },
];
export const BOOK_FRAMES = trackFrames(bookBeats);

export const BookScene: React.FC = () => (
  <Chapter
    mode="light"
    caption={
      <Caption
        palette={light}
        eyebrow="02 · Book"
        headline={
          <>
            Booked in two
            <br />
            clear steps
          </>
        }
        sub="A transactional flow — nothing is reserved until the server confirms it."
      />
    }
    phone={<BeatTrack beats={bookBeats} tapColor={light.brand} />}
  />
);

export const BookSfx: React.FC = () => {
  const confirmationStart = trackFrames(bookBeats.slice(0, 6));
  return (
    <Sequence from={confirmationStart + 12} durationInFrames={40} name="Ding">
      <Audio src={ding} volume={0.3} />
    </Sequence>
  );
};

// ---------------------------------------------------------------------------
// Manage: open appointment -> reschedule -> cancel.
// ---------------------------------------------------------------------------

export const manageBeats: Beat[] = [
  { seg: segments.apptOpen, lead: 4, hold: 2 },
  { seg: segments.reschedOpen, hold: 2 },
  { seg: segments.reschedPickDay, hold: 2 },
  { seg: segments.reschedScroll, rate: 1.25, hold: 2 },
  { seg: segments.reschedPickSlot, hold: 2 },
  { seg: segments.reschedDone, hold: 10 },
  { seg: segments.cancelRed, hold: 34 },
  { seg: segments.cancelDone, hold: 44 },
];
export const MANAGE_FRAMES = trackFrames(manageBeats);

export const ManageScene: React.FC = () => (
  <Chapter
    mode="light"
    caption={
      <Caption
        palette={light}
        eyebrow="03 · Manage"
        headline={
          <>
            Plans change.
            <br />
            No problem.
          </>
        }
        sub="Reschedule against live availability, or cancel with one focused confirmation."
      />
    }
    phone={<BeatTrack beats={manageBeats} tapColor={light.brand} />}
  />
);

// ---------------------------------------------------------------------------
// Arabic: layout mirrors, app restarts into RTL.
// ---------------------------------------------------------------------------

export const arabicBeats: Beat[] = [
  { seg: segments.langPre, lead: 20, hold: 0 },
  { seg: segments.langSwitch, hold: 6 },
  { seg: segments.arWelcome, lead: 2, hold: 8 },
  { seg: segments.arFindcare, hold: 10 },
  { seg: segments.arProfileScroll, rate: 1.1, hold: 18 },
];
export const ARABIC_FRAMES = trackFrames(arabicBeats);

export const ArabicScene: React.FC = () => (
  <Chapter
    mode="light"
    mirrored
    caption={
      <Caption
        palette={light}
        rtl
        headlineArabic
        eyebrow="04 · Arabic"
        headline={
          <>
            يتحدث العربية
            <br />
            بطلاقة
          </>
        }
        sub="Full localization with native RTL. The app restarts itself and every layout mirrors — not just the text."
      />
    }
    phone={<BeatTrack beats={arabicBeats} tapColor={light.brand} />}
  />
);

export const ArabicSfx: React.FC = () => {
  const reloadFrame = trackFrames(arabicBeats.slice(0, 1)) + 18;
  return (
    <Sequence from={reloadFrame} durationInFrames={40} name="Reload switch">
      <Audio src={uiSwitch} volume={0.35} />
    </Sequence>
  );
};

// ---------------------------------------------------------------------------
// Dark: tap داكن — the app and the whole composition flip together.
// ---------------------------------------------------------------------------

export const darkBeats: Beat[] = [
  { seg: segments.darkPre, hold: 12 },
  { seg: segments.darkHomeScroll, hold: 26 },
];
export const DARK_FRAMES = trackFrames(darkBeats);
export const DARK_SCENE_FLIP = DARK_FLIP_FRAME; // darkPre has no lead

export const DarkScene: React.FC = () => (
  <Chapter
    mode="light"
    mirrored
    flipAt={DARK_SCENE_FLIP}
    caption={
      <Caption
        palette={dark}
        from={DARK_SCENE_FLIP + 4}
        eyebrow="05 · Dark mode"
        headline={
          <>
            Easy on
            <br />
            the eyes
          </>
        }
        sub="Light, dark, or follow the device — the whole theme flips instantly."
      />
    }
    phone={<BeatTrack beats={darkBeats} tapColor={dark.brand} />}
  />
);

export const DarkSfx: React.FC = () => (
  <Sequence
    from={DARK_SCENE_FLIP - 4}
    durationInFrames={40}
    name="Theme switch"
  >
    <Audio src={uiSwitch} volume={0.35} />
  </Sequence>
);
