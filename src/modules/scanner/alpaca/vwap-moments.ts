export type VwapMoment={mean:number;m2:number};

/** Weighted population variance, without subtracting two large squared prices. */
export function addVwapMoment(moment:VwapMoment,previousWeight:number,value:number,weight:number):void{
 if(![previousWeight,value,weight,moment.mean,moment.m2].every(Number.isFinite)||previousWeight<0||weight<0||moment.m2<0)throw Error('invalid_vwap_moment');
 if(!weight)return;
 if(!previousWeight){moment.mean=value;moment.m2=0;return;}
 const total=previousWeight+weight,delta=value-moment.mean;
 const combinedWeight=Math.min(previousWeight,weight)*(Math.max(previousWeight,weight)/total);
 const mean=moment.mean*(previousWeight/total)+value*(weight/total);
 const m2=moment.m2+delta*(delta*combinedWeight);
 if(!Number.isFinite(total)||!Number.isFinite(mean)||!Number.isFinite(m2))throw Error('invalid_vwap_moment');
 moment.mean=mean;moment.m2=Math.max(0,m2);
}
