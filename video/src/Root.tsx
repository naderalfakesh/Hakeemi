import React from "react";
import { Composition } from "remotion";
import { Master, MASTER_FRAMES } from "./Master";
import { Loop, LOOP_FRAMES } from "./Loop";
import { PhoneOnly, PHONE_ONLY_FRAMES } from "./PhoneOnly";
import {
  DeviceFull,
  DEVICE_FULL_FRAMES,
  DEVICE_H,
  DEVICE_W,
} from "./DeviceFull";
import "./index.css";

export const RemotionRoot: React.FC = () => {
  return (
    <>
      <Composition
        id="HakeemiPromo"
        component={Master}
        durationInFrames={MASTER_FRAMES}
        fps={30}
        width={1920}
        height={1080}
      />
      <Composition
        id="HakeemiPhone"
        component={PhoneOnly}
        durationInFrames={PHONE_ONLY_FRAMES}
        fps={30}
        width={1080}
        height={1920}
      />
      <Composition
        id="HakeemiDevice"
        component={DeviceFull}
        durationInFrames={DEVICE_FULL_FRAMES}
        fps={30}
        width={DEVICE_W}
        height={DEVICE_H}
      />
      <Composition
        id="HakeemiLoop"
        component={Loop}
        durationInFrames={LOOP_FRAMES}
        fps={30}
        width={1200}
        height={750}
      />
    </>
  );
};
