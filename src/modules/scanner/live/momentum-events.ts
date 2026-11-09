import { LEGACY_SCAN_MS } from "./event-timing";
import type { MomentumDetectionSessionControls,MomentumSignal,RollingActivity } from "./contracts";

type Episode={confirmedAt:number;startAt:number;startPrice:number;lastAt:number;lastActiveAt:number;samples:number;shares:number;dollars:number;lastRate:number|null;quietScans:number;};
export type MomentumEventResult=Readonly<{signals:readonly MomentumSignal[];activity:RollingActivity}>;

export class MomentumEventBook{
  private episodes=new Map<string,Episode>();
  private context:string|null=null;
  constructor(private readonly elapsedTime=false) {}
  evaluate(context:string,symbol:string,price:number,float:number,receivedAt:number,activity:RollingActivity,controls:MomentumDetectionSessionControls):MomentumEventResult{
    if(this.context!==context){this.context=context;this.episodes.clear();}
    const seconds=activity.intervalSeconds??null,shares=activity.intervalVolume??null,dollars=activity.intervalDollarVolume??null;
    const rate=activity.intervalVolumeRate??null,multiple=activity.intervalVolumeRateMultiple??null;
    let episode=this.episodes.get(symbol);
    if(episode&&receivedAt-episode.lastAt>controls.episodeQuietSeconds*1000){this.episodes.delete(symbol);episode=undefined;}
    const intervalTurnover=float>0?(shares??0)/float*100:0;
    const absoluteSeed=(shares??0)>=controls.minimumEpisodeShares/4||(dollars??0)>=controls.minimumEpisodeDollarVolume/4
      ||intervalTurnover>=controls.minimumEpisodeFloatTurnoverPercent/4;
    const relativeSeed=multiple!==null&&multiple>=controls.buildingVolumeRateMultiple;
    if(!episode&&(absoluteSeed||relativeSeed)){
      const intervalGain=activity.intervalGain??0,priorPrice=intervalGain>-100?price/(1+intervalGain/100):price;
      episode={confirmedAt:receivedAt,startAt:receivedAt-(seconds??0)*1000,startPrice:priorPrice,lastAt:receivedAt,lastActiveAt:receivedAt,samples:1,
        shares:shares??0,dollars:dollars??0,lastRate:rate,quietScans:0};
    }
    if(episode&&receivedAt>episode.lastAt){
      const addedShares=this.elapsedTime?activity.observationVolume??0:shares??0;
      const addedDollars=this.elapsedTime?activity.observationDollarVolume??0:dollars??0;
      const active=addedShares>0&&(absoluteSeed||relativeSeed);
      episode={...episode,lastAt:receivedAt,lastActiveAt:active?receivedAt:episode.lastActiveAt,samples:episode.samples+1,
        shares:episode.shares+addedShares,dollars:episode.dollars+addedDollars,lastRate:rate,quietScans:active?0:episode.quietScans+1};
      if(receivedAt-episode.lastActiveAt>controls.episodeQuietSeconds*1000||(this.elapsedTime?receivedAt-episode.lastActiveAt>=controls.episodeQuietScans*LEGACY_SCAN_MS:episode.quietScans>=controls.episodeQuietScans)){this.episodes.delete(symbol);episode=undefined;}
      else this.episodes.set(symbol,episode);
    }else if(episode&&!this.episodes.has(symbol))this.episodes.set(symbol,episode);
    const signals:MomentumSignal[]=[];
    const episodeTurnover=episode&&float>0?episode.shares/float*100:0;
    const dimensions=episode?Number(episode.shares>=controls.minimumEpisodeShares)+Number(episode.dollars>=controls.minimumEpisodeDollarVolume)
      +Number(episodeTurnover>=controls.minimumEpisodeFloatTurnoverPercent):0;
    const enough=dimensions>=2;
    const strongAbsolute=episode?Number(episode.shares>=controls.minimumEpisodeShares*2)+Number(episode.dollars>=controls.minimumEpisodeDollarVolume*2)
      +Number(episodeTurnover>=controls.minimumEpisodeFloatTurnoverPercent*2)>=2:false;
    if(enough&&((multiple??0)>=controls.immediateVolumeRateMultiple||activity.baselineVolumeRate===0||activity.baselineVolumeRate===null))signals.push("volume_ignition");
    if(enough&&episode&&(this.elapsedTime?receivedAt-episode.confirmedAt>=(controls.buildingConfirmationScans-1)*LEGACY_SCAN_MS:episode.samples>=controls.buildingConfirmationScans)&&(multiple??0)>=controls.buildingVolumeRateMultiple)signals.push("building_volume");
    if(seconds!==null&&seconds<=controls.maximumPriceBurstSeconds&&(activity.intervalGain??-Infinity)>=controls.priceBurstPercent&&absoluteSeed)signals.push("price_burst");
    const episodeGain=episode?(price/episode.startPrice-1)*100:null;
    if(enough&&episodeGain!==null&&episodeGain>=.5&&((multiple??0)>=controls.buildingVolumeRateMultiple||strongAbsolute))signals.push("developing_activity");
    return {signals:Object.freeze(signals),activity:{...activity,episodeShares:episode?.shares??null,episodeDollarVolume:episode?.dollars??null,
      episodeSeconds:episode?(receivedAt-episode.startAt)/1000:null}};
  }
  retain(symbols:readonly string[]):void{const keep=new Set(symbols);for(const symbol of this.episodes.keys())if(!keep.has(symbol))this.episodes.delete(symbol);}
  clear():void{this.context=null;this.episodes.clear();}
}
