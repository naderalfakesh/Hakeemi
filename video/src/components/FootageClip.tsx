import React from "react";
import { Freeze, Img, Sequence, staticFile } from "remotion";
import { Video } from "@remotion/media";
import type { SegmentInfo } from "../segments";
import { FOOTAGE_H, FOOTAGE_W } from "../theme";
import { TapIndicator } from "./TapIndicator";

export const FPS = 30;

/**
 * Renders one prepared footage segment inside the phone screen, with an
 * optional frozen lead-in / tail-hold and brand tap indicators.
 *
 * Timeline within the parent sequence:
 *   [0 .. lead)                     frozen first frame
 *   [lead .. lead+media)            video plays
 *   [lead+media .. end of parent)   frozen last frame
 */
export const FootageClip: React.FC<{
  seg: SegmentInfo;
  lead?: number;
  tapColor: string;
  playbackRate?: number;
}> = ({ seg, lead = 0, tapColor, playbackRate = 1 }) => {
  const src = staticFile(seg.file);

  const media = seg.still
    ? 0
    : Math.max(1, Math.round(((seg.dur ?? 0) * FPS) / playbackRate) - 1);

  const video = <Video src={src} playbackRate={playbackRate} muted />;

  return (
    <>
      {seg.still ? (
        <Img
          src={src}
          style={{ width: "100%", height: "100%", objectFit: "cover" }}
        />
      ) : (
        <>
          {lead > 0 && (
            <Sequence durationInFrames={lead} name="Lead hold">
              <Freeze frame={0}>{video}</Freeze>
            </Sequence>
          )}
          <Sequence from={lead} durationInFrames={media} name="Playback">
            {video}
          </Sequence>
          <Sequence from={lead + media} name="Tail hold">
            <Freeze frame={media - 1}>{video}</Freeze>
          </Sequence>
        </>
      )}
      {seg.taps?.map((tap, i) => (
        <div
          key={i}
          style={{
            position: "absolute",
            left: `${(tap.x / FOOTAGE_W) * 100}%`,
            top: `${(tap.y / FOOTAGE_H) * 100}%`,
          }}
        >
          <TapIndicator
            from={lead + Math.round((tap.at * FPS) / playbackRate)}
            color={tapColor}
          />
        </div>
      ))}
    </>
  );
};
