import type {CanvasRenderingTarget2D} from 'fancy-canvas';
import type {IPanePrimitive,IPanePrimitivePaneView,IPrimitivePaneRenderer,PaneAttachedParameter,Time,UTCTimestamp} from 'lightweight-charts';
import type {IndicatorPoint} from './chart-indicators';

type BandPoint={time:number;upper:number;lower:number};
/** Uses the native chart's scales; it never changes prices or autoscale bounds. */
export class ChartBandFill implements IPanePrimitive<Time>{
 private attachedTo:PaneAttachedParameter<Time>|null=null;
 private data:BandPoint[]=[];
 private color='';
 private oppositeColor?:string;
 private readonly renderer:IPrimitivePaneRenderer={draw:target=>this.draw(target)};
 private readonly views:IPanePrimitivePaneView[]=[{zOrder:()=> 'normal',renderer:()=>this.renderer}];
 constructor(private readonly priceCoordinate:(price:number)=>number|null){}
 attached(parameter:PaneAttachedParameter<Time>):void{this.attachedTo=parameter;}
 detached():void{this.attachedTo=null;this.data=[];}
 paneViews():readonly IPanePrimitivePaneView[]{return this.views;}
 update(upper:readonly IndicatorPoint[],lower:readonly IndicatorPoint[],color:string,opacity:number,visible:boolean,oppositeColor?:string):void{
  this.data=[];
  if(visible&&opacity>0){
   let i=0,j=0;
   while(i<upper.length&&j<lower.length){
    const a=upper[i],b=lower[j];
    if(a.time===b.time)this.data.push({time:a.time,upper:a.value,lower:b.value});
    if(a.time<=b.time)i++;
    if(b.time<=a.time)j++;
   }
  }
  const rgba=(hex:string)=>`rgba(${parseInt(hex.slice(1,3),16)},${parseInt(hex.slice(3,5),16)},${parseInt(hex.slice(5,7),16)},${opacity/100})`;
  this.color=rgba(color);
  this.oppositeColor=oppositeColor?rgba(oppositeColor):undefined;
  this.attachedTo?.requestUpdate();
 }
 private draw(target:CanvasRenderingTarget2D):void{
  const chart=this.attachedTo?.chart,range=chart?.timeScale().getVisibleRange();
  if(!chart||!range||typeof range.from!=='number'||typeof range.to!=='number'||this.data.length<2)return;
  const position=(time:number)=>{let low=0,high=this.data.length;while(low<high){const middle=(low+high)>>>1;if(this.data[middle].time<time)low=middle+1;else high=middle;}return low;};
  const first=Math.max(0,position(range.from)-1),last=Math.min(this.data.length-1,position(range.to)+1);
  target.useBitmapCoordinateSpace(({context,horizontalPixelRatio,verticalPixelRatio})=>{
   const points:{x:number;upper:number;lower:number}[]=[];
   for(let n=first;n<=last;n++){
    const point=this.data[n],x=chart.timeScale().timeToCoordinate(point.time as UTCTimestamp),upper=this.priceCoordinate(point.upper),lower=this.priceCoordinate(point.lower);
    if(x!==null&&upper!==null&&lower!==null&&[x,upper,lower].every(Number.isFinite))points.push({x:x*horizontalPixelRatio,upper:upper*verticalPixelRatio,lower:lower*verticalPixelRatio});
   }
   if(points.length<2)return;
   context.save();
   if(this.oppositeColor){
    const fill=(a:typeof points[number],b:typeof points[number],color:string)=>{
     context.fillStyle=color;context.beginPath();context.moveTo(a.x,a.upper);
     context.lineTo(b.x,b.upper);context.lineTo(b.x,b.lower);context.lineTo(a.x,a.lower);
     context.closePath();context.fill();
    };
    for(let n=1;n<points.length;n++){
     const a=points[n-1],b=points[n],diffA=a.lower-a.upper,diffB=b.lower-b.upper;
     const colorA=diffA>=0?this.color:this.oppositeColor,colorB=diffB>=0?this.color:this.oppositeColor;
     if(colorA===colorB){fill(a,b,colorA);continue;}
     const weight=diffA/(diffA-diffB),cross=a.upper+(b.upper-a.upper)*weight;
     const center={x:a.x+(b.x-a.x)*weight,upper:cross,lower:cross};
     fill(a,center,colorA);fill(center,b,colorB);
    }
    context.restore();return;
   }
   context.fillStyle=this.color;context.beginPath();context.moveTo(points[0].x,points[0].upper);
   for(let n=1;n<points.length;n++)context.lineTo(points[n].x,points[n].upper);
   for(let n=points.length-1;n>=0;n--)context.lineTo(points[n].x,points[n].lower);
   context.closePath();context.fill();context.restore();
  });
 }
}
