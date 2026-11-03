import {describe,expect,it} from "vitest";
import {MomentumEventBook} from "./momentum-events";
import {DEFAULT_MOMENTUM_DETECTION} from "./settings";
import type {RollingActivity} from "./contracts";

const at=Date.parse("2026-11-03T14:00:00Z");
const activity=(patch:Partial<RollingActivity>):RollingActivity=>({oneMinuteGain:null,fiveMinuteGain:null,oneMinuteVolume:null,
  oneMinuteDollarVolume:null,fiveMinuteVolume:null,fiveMinuteVolumeSpike:null,volumeAcceleration:null,...patch});

describe("early momentum events",()=>{
  it("qualifies immediate volume ignition and a price burst on the first sub-30-second observation",()=>{
    const result=new MomentumEventBook().evaluate("2026-11-03:premarket","AAA",1.03,5_000_000,at,activity({intervalSeconds:12,intervalGain:3,intervalVolume:30_000,
      intervalDollarVolume:30_000,intervalVolumeRate:2500,baselineVolumeRate:250,intervalVolumeRateMultiple:10}),DEFAULT_MOMENTUM_DETECTION.premarket);
    expect(result.signals).toEqual(expect.arrayContaining(["volume_ignition","price_burst","developing_activity"]));
    expect(result.activity.episodeShares).toBe(30_000);
  });
  it("accumulates a building episode from its detected starting interval",()=>{
    const book=new MomentumEventBook();
    const first=book.evaluate("2026-11-03:premarket","AAA",1.001,5_000_000,at,activity({intervalSeconds:15,intervalGain:.1,intervalVolume:8_000,intervalDollarVolume:8_000,
      intervalVolumeRate:533,baselineVolumeRate:200,intervalVolumeRateMultiple:2.665}),DEFAULT_MOMENTUM_DETECTION.premarket);
    expect(first.signals).toEqual([]);
    const second=book.evaluate("2026-11-03:premarket","AAA",1.008,5_000_000,at+15_000,activity({intervalSeconds:15,intervalGain:.7,intervalVolume:17_000,intervalDollarVolume:20_000,
      intervalVolumeRate:1133,baselineVolumeRate:200,intervalVolumeRateMultiple:5.665}),DEFAULT_MOMENTUM_DETECTION.premarket);
    expect(second.signals).toContain("building_volume");
    expect(second.activity.episodeShares).toBe(25_000);
    expect(second.activity.episodeDollarVolume).toBe(28_000);
  });
  it("expires an abandoned episode instead of carrying old activity forward",()=>{
    const book=new MomentumEventBook();
    book.evaluate("2026-11-03:premarket","AAA",1,5_000_000,at,activity({intervalSeconds:10,intervalVolume:10_000,intervalDollarVolume:10_000,intervalVolumeRate:1000,
      baselineVolumeRate:100,intervalVolumeRateMultiple:10}),DEFAULT_MOMENTUM_DETECTION.premarket);
    const result=book.evaluate("2026-11-03:premarket","AAA",1,5_000_000,at+100_000,activity({intervalSeconds:100,intervalVolume:0,intervalDollarVolume:0,intervalVolumeRate:0,
      baselineVolumeRate:100,intervalVolumeRateMultiple:0}),DEFAULT_MOMENTUM_DETECTION.premarket);
    expect(result.activity.episodeShares).toBeNull();
  });
  it("starts a new episode ledger when the market session changes",()=>{
    const book=new MomentumEventBook(),burst=activity({intervalSeconds:10,intervalVolume:30_000,intervalDollarVolume:30_000,
      intervalVolumeRate:3000,baselineVolumeRate:100,intervalVolumeRateMultiple:30});
    expect(book.evaluate("2026-11-03:premarket","AAA",1,5_000_000,at,burst,DEFAULT_MOMENTUM_DETECTION.premarket).activity.episodeShares).toBe(30_000);
    const regular=book.evaluate("2026-11-03:regular","AAA",1,5_000_000,at+10_000,activity({}),DEFAULT_MOMENTUM_DETECTION.regular);
    expect(regular.activity.episodeShares).toBeNull();
  });
  it("replays PARA's audited premarket build without a fixed 30K-share gate",()=>{
    const book=new MomentumEventBook(),controls=DEFAULT_MOMENTUM_DETECTION.premarket,context="2026-11-03:premarket";
    const first=book.evaluate(context,"PARA",1.91,50_000_000,at,activity({intervalSeconds:9.9,intervalGain:1.6,intervalVolume:5_922,
      intervalDollarVolume:11_203,intervalVolumeRate:598,baselineVolumeRate:50,intervalVolumeRateMultiple:11.96}),controls);
    expect(first.signals).toContain("price_burst");
    book.evaluate(context,"PARA",1.90,50_000_000,at+9_800,activity({intervalSeconds:9.8,intervalGain:-.52,intervalVolume:644,
      intervalDollarVolume:1_227,intervalVolumeRate:66,baselineVolumeRate:50,intervalVolumeRateMultiple:1.32}),controls);
    const built=book.evaluate(context,"PARA",2,50_000_000,at+20_300,activity({intervalSeconds:10.5,intervalGain:5.26,intervalVolume:7_926,
      intervalDollarVolume:15_315,intervalVolumeRate:755,baselineVolumeRate:50,intervalVolumeRateMultiple:15.1}),controls);
    expect(built.activity.episodeShares).toBe(14_492);
    expect(built.activity.episodeDollarVolume).toBe(27_745);
    expect(built.signals).toEqual(expect.arrayContaining(["volume_ignition","building_volume","developing_activity"]));
  });
});
