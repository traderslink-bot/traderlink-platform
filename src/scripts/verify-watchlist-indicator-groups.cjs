const assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm'),ts=require('typescript');
function load(p){const m={exports:{}};vm.runInNewContext(ts.transpileModule(fs.readFileSync(p,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText,{module:m,exports:m.exports,require:()=>load('app/watchlist/watchlist-indicator-help.ts'),Intl,Number,Object});return m.exports;}
const {watchlistIndicatorGroups}=load('app/watchlist/watchlist-indicator-groups.ts');
const {indicatorDisplayRows}=load('src/lib/live-watchlist/indicators/indicator-presentation.ts');
for(const timeframe of ['1m','5m','15m','1d']) for(const result of [undefined,{trend:'uptrend',ema9:12,ema20:11,rsi14:75,rsiDirection:'falling',rsiChange:-4,rsiCondition:'overbought'}, {rsi14:25,rsiDirection:'rising',rsiChange:4,rsiCondition:'oversold'}]) {
 const original=indicatorDisplayRows({timeframe,result,livePrice:12,vwap:11});
 const groups=watchlistIndicatorGroups(original);
 assert.equal(groups.length,5);assert.equal(groups.flatMap(g=>g.parts).length,7);
 assert.equal(groups[0].parts.map(p=>p.label).join(','),'Trend,Moving averages');
 assert.equal(groups[1].parts.map(p=>p.label).join(','),'RSI,Momentum');
 for(const row of original){assert.equal(groups.flatMap(g=>g.parts).filter(p=>p===row).length,1);}
 for(const group of groups) assert.ok(group.help.length>80);
 if(result?.rsi14===75)assert.equal(groups[1].parts[0].conditionState,'Overbought');
 if(result?.rsi14===25)assert.equal(groups[1].parts[0].conditionState,'Oversold');
}
console.log('PASS: five groups retain all seven original readings exactly once, including partial/unavailable values, RSI conditions and combined help across four timeframes.');
