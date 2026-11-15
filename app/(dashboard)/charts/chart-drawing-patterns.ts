import type { Anchor, Point } from "./chart-drawings";

export const patternTools = {
  xabcd:"XABCD Pattern",
  cypher:"Cypher Pattern",
  abcd:"ABCD Pattern",
  trianglePattern:"Triangle Pattern",
  threeDrives:"Three Drives Pattern",
  headAndShoulders:"Head and Shoulders",
  elliottImpulse:"Elliott Impulse Wave",
  elliottCorrection:"Elliott Correction Wave",
  elliottTriangle:"Elliott Triangle Wave",
  elliottDouble:"Elliott Double Combo Wave",
  elliottTriple:"Elliott Triple Combo Wave",
} as const;
export type PatternTool=keyof typeof patternTools;

export const patternLabels:Record<PatternTool,readonly string[]>={
  xabcd:["X","A","B","C","D"],
  cypher:["X","A","B","C","D"],
  abcd:["A","B","C","D"],
  trianglePattern:["A","B","C","D"],
  threeDrives:["Start","1","A","2","C","3","End"],
  headAndShoulders:["Start","Left shoulder","Neckline","Head","Neckline","Right shoulder","End"],
  elliottImpulse:["Start","1","2","3","4","5"],
  elliottCorrection:["Start","A","B","C"],
  elliottTriangle:["Start","A","B","C","D","E"],
  elliottDouble:["Start","W","X","Y"],
  elliottTriple:["Start","W","X","Y","X","Z"],
};

type LegRatio={between:[number,number];swing:[number,number];base:[number,number]};
const ratios:Partial<Record<PatternTool,LegRatio[]>>={
  xabcd:[
    {between:[0,2],swing:[1,2],base:[0,1]},
    {between:[1,3],swing:[2,3],base:[1,2]},
    {between:[2,4],swing:[3,4],base:[2,3]},
    {between:[0,4],swing:[1,4],base:[0,1]},
  ],
  cypher:[
    {between:[0,2],swing:[1,2],base:[0,1]},
    {between:[0,3],swing:[0,3],base:[0,1]},
    {between:[0,4],swing:[3,4],base:[0,3]},
  ],
  abcd:[
    {between:[0,2],swing:[1,2],base:[0,1]},
    {between:[1,3],swing:[2,3],base:[1,2]},
  ],
  threeDrives:[
    {between:[1,3],swing:[2,3],base:[1,2]},
    {between:[3,5],swing:[4,5],base:[3,4]},
  ],
};

export function patternMeasurements(tool:PatternTool, anchors:Anchor[]){
  const difference=([first,last]:[number,number])=>Math.abs(anchors[last].price-anchors[first].price);
  return (ratios[tool]??[]).flatMap(({between,swing,base})=>{
    if([...between,...swing,...base].some(index=>index>=anchors.length))return [];
    const length=difference(base);
    const ratio=difference(swing)/length;
    return Number.isFinite(ratio)?[{between,ratio}]:[];
  });
}

export function patternGeometry(tool:PatternTool, points:Point[], anchors:Anchor[]){
  const lines=points.slice(1).map((point,index):[Point,Point]=>[points[index],point]);
  const guides:[Point,Point][]=[];
  const bands:Point[][]=[];
  const measurements=patternLabels[tool].flatMap((label,index)=>{
    const point=points[index];
    if(!point||label==="Start"||label==="End"||label==="Neckline")return [];
    const adjacent=points[index+1]??points[index-1];
    return [{point:{x:point.x,y:point.y+(adjacent&&point.y>adjacent.y?4:-20)},lines:[label],align:"center" as const}];
  });

  if(tool==="xabcd"||tool==="cypher"){
    if(points.length>=3)bands.push(points.slice(0,3));
    if(points.length>=5)bands.push(points.slice(2,5));
  }
  if(tool==="headAndShoulders"&&points.length>=5){
    guides.push([points[2],points[4]]);
    bands.push(points.slice(2,5));
  }
  if(tool==="trianglePattern"&&points.length>=4){
    const [a,b,c,d]=points;
    const upper=(c.y-a.y)/(c.x-a.x),lower=(d.y-b.y)/(d.x-b.x);
    const x=(b.y-a.y+upper*a.x-lower*b.x)/(upper-lower);
    const tip={x,y:a.y+upper*(x-a.x)};
    if(Number.isFinite(tip.y)&&x>Math.max(c.x,d.x)&&x<Math.max(c.x,d.x)+8*Math.abs(d.x-a.x)){
      guides.push([a,tip],[b,tip]);
      bands.push([a,tip,b]);
    }else guides.push([a,c],[b,d]);
  }
  for(const {between:[first,last],ratio} of patternMeasurements(tool,anchors)){
    const a=points[first],b=points[last];
    guides.push([a,b]);
    measurements.push({point:{x:(a.x+b.x)/2,y:(a.y+b.y)/2-9},
      lines:[ratio.toFixed(3)],align:"center"});
  }
  return {lines,guides,bands,measurements};
}
