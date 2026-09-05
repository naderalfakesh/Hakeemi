import React from "react";
import { Sequence, Series } from "remotion";
import { Audio } from "@remotion/media";
import { mouseClick } from "@remotion/sfx";
import type { SegmentInfo } from "../segments";
import { FootageClip, FPS } from "./FootageClip";

export type Beat = {
  seg: SegmentInfo;
  /** Frames to freeze on the first frame before playback. */
  lead?: number;
  /** Frames to hold the last frame after playback (stills: total duration). */
  hold?: number;
  rate?: number;
};

export const beatFrames = (b: Beat) => {
  const media = b.seg.still
    ? 0
    : Math.max(1, Math.round(((b.seg.dur ?? 0) * FPS) / (b.rate ?? 1)) - 1);
  return (b.lead ?? 0) + media + (b.hold ?? 0);
};

export const trackFrames = (beats: Beat[]) =>
  beats.reduce((sum, b) => sum + beatFrames(b), 0);

const tapFrame = (seg: SegmentInfo, lead: number, rate: number, at: number) =>
  lead + Math.round((at * FPS) / rate);

/**
 * Plays a list of beats back to back inside the phone screen, adding a soft
 * click for every tap indicator.
 */
export const BeatTrack: React.FC<{
  beats: Beat[];
  tapColor: string;
  muteTaps?: boolean;
}> = ({ beats, tapColor, muteTaps }) => {
  return (
    <Series>
      {beats.map((b, i) => (
        <Series.Sequence
          key={i}
          durationInFrames={beatFrames(b)}
          name={b.seg.file.replace("footage/", "")}
        >
          <FootageClip
            seg={b.seg}
            lead={b.lead ?? 0}
            tapColor={tapColor}
            playbackRate={b.rate ?? 1}
          />
          {!muteTaps &&
            b.seg.taps?.map((tap, j) => (
              <Sequence
                key={`sfx-${j}`}
                from={tapFrame(b.seg, b.lead ?? 0, b.rate ?? 1, tap.at)}
                durationInFrames={20}
                name="Tap click"
              >
                <Audio src={mouseClick} volume={0.35} />
              </Sequence>
            ))}
        </Series.Sequence>
      ))}
    </Series>
  );
};
