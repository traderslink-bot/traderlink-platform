import { describe, expect, it } from "vitest";
import type { FocusControls, RollingActivity } from "./contracts";
import { qualifiesFiveMinuteMomentum } from "./engine";
import { initialConfiguration } from "./settings";

const controls: FocusControls=initialConfiguration().momentum.focus;
const activity=(fiveMinuteGain:number|null,fiveMinuteVolumeSpike:number|null):RollingActivity=>({
  oneMinuteGain:null,fiveMinuteGain,oneMinuteVolume:null,oneMinuteDollarVolume:null,
  fiveMinuteVolume:null,fiveMinuteVolumeSpike,volumeAcceleration:null,
});

describe("five-minute momentum signal",()=>{
  it("defaults to a 3% move supported by at least 2x rolling five-minute volume",()=>{
    expect(controls.minimumFiveMinuteGain).toBe(3);
    expect(controls.minimumVolumeAcceleration).toBe(2);
    expect(qualifiesFiveMinuteMomentum(activity(3,2),controls)).toBe(true);
  });

  it("rejects price movement without matching volume support",()=>{
    expect(qualifiesFiveMinuteMomentum(activity(5,1.99),controls)).toBe(false);
    expect(qualifiesFiveMinuteMomentum(activity(5,null),controls)).toBe(false);
  });

  it("rejects ordinary price movement even when volume expands",()=>{
    expect(qualifiesFiveMinuteMomentum(activity(2.99,5),controls)).toBe(false);
  });
});
