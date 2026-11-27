import type {ScanPattern} from "./candle-patterns";
import type { CandleStudy, StudyFrame } from "./audited-filters";
import type { ScannerSession } from "../live/contracts";
import type { CustomIndicator, IndicatorMatch } from "./custom-indicator";
import type { ScanMarketRow, ScanQuery } from "./definition";
import type { ScanIndicatorFacts, ScanPressRelease, ScanSignalFrame, StructureScanSignal } from "./signal-filters";

export interface ScanEnrichment {
  attach(queries:readonly ScanQuery[]):()=>void;
  observe(symbols:Iterable<string>, observedAt:number, activity?:Iterable<ScanMarketRow>):void;
  onHistoryUpdate?(notify:(companyChanged?:boolean)=>void):void;
  closeSession?():void;
  pressRelease(symbol:string, observedAt:number):ScanPressRelease | null | undefined;
  customIndicator?(symbol:string,frame:ScanSignalFrame,observedAt:number,config:CustomIndicator,key:string,depth:number):IndicatorMatch|undefined;
  structureSignal?(symbol:string, frame:ScanSignalFrame, at:number, signal:StructureScanSignal):number|null|undefined;
  companyReadings?(symbol:string,at:number):import("./audited-filters").CompanyReadings|undefined;
  candleStudy?(symbol:string,at:number,frame:StudyFrame,metric:CandleStudy,period:number,fast?:number,signal?:number,pattern?:ScanPattern):number|null;
  lastMinute?(symbol:string,at:number): {start:number;close:number;previous:number|null;previousAt?:number;lowPivot?:{at:number;price:number};relativeVolume:number|null;vwapCross?:number|null} | undefined;
  sameTimeVolumeRatio?(symbol:string, observedAt:number, session:ScannerSession):number|null;
  indicator(symbol:string, frame:ScanSignalFrame, observedAt:number):ScanIndicatorFacts | undefined;
}
