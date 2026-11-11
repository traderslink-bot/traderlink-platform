import {describe,expect,it} from "vitest";
import type {LiveScannerRow} from "./contracts";
import {MomentumRetentionBook} from "./momentum-retention";

const row=(signals:LiveScannerRow["momentumSignals"]):LiveScannerRow=>({symbol:"PARA",exchange:"NASDAQ",company:"Paramount",price:2,
  sessionGain:10,volume:100_000,dollarVolume:200_000,marketCap:100_000_000,marketCapAtCollection:100_000_000,float:50_000_000,
  relativeVolume:2,dayHigh:2.1,dayLow:1.7,offHighPercent:-4.76,floatRetrievedAtUtc:"2026-11-03T13:00:00.000Z",spreadPercent:1,
  providerAtUtc:"2026-11-03T14:00:00.000Z",receivedAtUtc:"2026-11-03T14:00:00.000Z",priceTimeBasis:"session_observation",
  activity:{oneMinuteGain:null,fiveMinuteGain:null,oneMinuteVolume:null,oneMinuteDollarVolume:null,fiveMinuteVolume:null,
    fiveMinuteVolumeSpike:null,volumeAcceleration:null},reasons:[],news:[],momentumSignals:signals});

describe("momentum cooling retention",()=>{
  it("cools for 30 seconds, reactivates on a new signal, and then expires",()=>{
    const book=new MomentumRetentionBook(),context="2026-11-03:regular",start=Date.parse("2026-11-03T14:00:00.000Z");
    expect(book.select(context,[row(["developing_activity"])],start)[0]).toMatchObject({momentumState:"active"});
    expect(book.select(context,[row([])],start+10_000)[0]).toMatchObject({momentumState:"cooling",momentumCoolingUntilUtc:"2026-11-03T14:00:30.000Z"});
    expect(book.select(context,[{...row(["volume_ignition"]),volume:110_000}],start+20_000)[0]).toMatchObject({momentumState:"active"});
    expect(book.select(context,[row([])],start+49_999)).toHaveLength(1);
    expect(book.select(context,[row([])],start+50_000)).toHaveLength(0);
  });
  it("does not refresh or re-enter on the same trade after a receipt, outage, or expiry", () => {
    const book = new MomentumRetentionBook(), context = "2026-11-03:regular";
    const start = Date.parse("2026-11-03T14:00:00Z");
    const observation = row(["one_minute_momentum"]);
    expect(book.select(context,[observation],start)[0]).toMatchObject({momentumState:"active"});
    const repeated = {...observation,receivedAtUtc:new Date(start+5_000).toISOString()};
    expect(book.select(context,[repeated],start+5_000)[0]).toMatchObject({
      momentumState:"cooling", momentumSignals:[], momentumLastActiveAtUtc:new Date(start).toISOString(),
    });
    expect(book.select(context,[],start+6_000)).toEqual([]);
    expect(book.select(context,[repeated],start+7_000)).toEqual([]);
    expect(book.select(context,[repeated],start+31_000)).toEqual([]);
    expect(book.select(context,[{...repeated,providerAtUtc:new Date(start+32_000).toISOString()}],start+32_000)[0])
      .toMatchObject({momentumState:"active",momentumLastActiveAtUtc:new Date(start+32_000).toISOString()});
  });
  it("does not retain a row that never generated a qualifying signal",()=>{
    expect(new MomentumRetentionBook().select("2026-11-03:regular",[row([])],Date.now())).toHaveLength(0);
  });
  it("clears cooling state when the session changes",()=>{
    const book=new MomentumRetentionBook(),now=Date.now();
    book.select("2026-11-03:premarket",[row(["developing_activity"])],now);
    expect(book.select("2026-11-03:regular",[row([])],now+1_000)).toHaveLength(0);
  });
});
