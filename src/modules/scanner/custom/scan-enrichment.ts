import type { CustomIndicator, IndicatorMatch } from "./custom-indicator";
import type { ScanMarketRow, ScanQuery } from "./definition";
import type { ScanIndicatorFacts, ScanPressRelease, ScanSignalFrame, StructureScanSignal } from "./signal-filters";

export interface ScanEnrichment {
  attach(queries:readonly ScanQuery[]):()=>void;
  observe(symbols:Iterable<string>, observedAt:number, activity?:Iterable<ScanMarketRow>):void;
  onHistoryUpdate?(notify:()=>void):void;
  closeSession?():void;
  pressRelease(symbol:string, observedAt:number):ScanPressRelease | null | undefined;
  customIndicator?(symbol:string,frame:ScanSignalFrame,observedAt:number,config:CustomIndicator,key:string,depth:number):IndicatorMatch|undefined;
  structureSignal?(symbol:string, frame:ScanSignalFrame, at:number, signal:StructureScanSignal):number|null|undefined;
  sameTimeVolumeRatio?(symbol:string, observedAt:number):number|null;
  indicator(symbol:string, frame:ScanSignalFrame, observedAt:number):ScanIndicatorFacts | undefined;
}
