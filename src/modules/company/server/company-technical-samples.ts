import { companySessionRanges, type CompanyTechnicals } from "../company-technicals";
import type { LiveScannerRow } from "@/src/modules/scanner/live/contracts";

export function companyTechnicalSample(symbol:string):CompanyTechnicals {
  const date="2026-11-13";
  const previous="2026-11-12";
  const receivedAtUtc=date+"T15:31:00.000Z";
  const bars=[previous,date].flatMap((day,index)=>{
    const times=index?["12:00","15:30"]:["12:00","15:30","22:00"];
    return times.map((time,i)=>({time:Date.parse(day+"T"+time+":00Z")/1000,open:0.027+i*0.001,high:0.031+i*0.001,low:0.024+i*0.001,close:!index&&i===1?0.0268:0.029+i*0.001,volume:270000+i*200000}));
  });
  const row:LiveScannerRow={symbol,company:symbol,exchange:"NASDAQ",price:0.03,sessionGain:12,volume:740000,dollarVolume:21150,
    comparisonPrice:0.0268,marketCap:2975592,marketCapAtCollection:2975592,float:24850000,relativeVolume:3.2,dayHigh:0.032,dayLow:0.024,
    offHighPercent:-6.25,floatRetrievedAtUtc:receivedAtUtc,spreadPercent:1.2,providerAtUtc:receivedAtUtc,receivedAtUtc,
    activity:{oneMinuteGain:1.2,fiveMinuteGain:3.4,oneMinuteVolume:13200,fiveMinuteVolume:82400,oneMinuteDollarVolume:396,
      fiveMinuteVolumeSpike:2.1,volumeAcceleration:1.4},reasons:[],news:[]};
  return {sample:true,days:companySessionRanges(bars,[previous,date].map(date=>({date,open:"09:30",close:"16:00"}))).reverse(),
    row,yearRange:{high:0.2562,low:0.0182,highDate:"2025-12-17",lowDate:"2026-11-10"},splitAdjustedYearRange:{high:0.5124,low:0.0182,highDate:"2025-12-17",lowDate:"2026-11-10"},bid:0.0298,ask:0.0302,scannerSignals:["Top Gainers","Momentum"]};
}
