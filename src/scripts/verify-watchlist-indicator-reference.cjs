// Independent third-party calculation comparison. No app engine imports or hosted writes.
const assert=require('node:assert/strict'), crypto=require('node:crypto'), vm=require('node:vm'), zlib=require('node:zlib');
const URL='https://cdn.jsdelivr.net/npm/technicalindicators@3.1.0/dist/index.js';
const HASH='83890f53cc855c07e173e6ff27235e952e66d444dafa48b740fab8970092b059';
async function main(){
  let input='';for await(const chunk of process.stdin){input+=chunk;assert.ok(input.length<8000000);}
  const line=input.split(/\r?\n/).find(x=>x.startsWith('INDICATOR_REFERENCE_INPUTS='));assert.ok(line);
  const snapshots=JSON.parse(zlib.gunzipSync(Buffer.from(line.split('=')[1],'base64'),{maxOutputLength:32000000}));
  assert.deepEqual(snapshots.map(s=>s.symbol),['TRUG','TNON','AENT','FTFT','FEIM','BDRX','SURG','SXTC','PCLA']);
  const response=await fetch(URL,{redirect:'error',signal:AbortSignal.timeout(15000)});assert.ok(response.ok);
  const source=await response.text();assert.equal(crypto.createHash('sha256').update(source).digest('hex'),HASH);
  // Pinned pure bundle has no imports; do not expose filesystem, network, process or require to it.
  const context=vm.createContext({exports:{}},{codeGeneration:{strings:false,wasm:false}});
  vm.runInContext(source,context,{timeout:3000});const ref=context.exports;
  const comparisons=[];let failures=0;
  const compare=(symbol,timeframe,indicator,actual,expected,tolerance)=>{
    const difference=Math.abs(actual-expected),pass=Number.isFinite(actual)&&Number.isFinite(expected)&&difference<=tolerance;
    comparisons.push({symbol,timeframe,indicator,actual,reference:expected,difference,tolerance,pass});if(!pass)failures++;
  };
  for(const s of snapshots){
    for(const f of s.timeframes){
      assert.ok(f.initialCheckpoint===null||f.initialCheckpoint.count===0,'Full seed history required');
      assert.ok(f.result&&f.candles.length>=35);const b=f.candles, values=b.map(c=>c.close);
      for(const period of [9,20])compare(s.symbol,f.timeframe,'EMA'+period,f.result['ema'+period],ref.EMA.calculate({period,values}).at(-1),1e-8);
      // This library explicitly rounds RSI to two decimal places. Keep the app's lossless result.
      compare(s.symbol,f.timeframe,'RSI14',f.result.rsi14,ref.RSI.calculate({period:14,values}).at(-1),0.005000001);
      compare(s.symbol,f.timeframe,'ATR14',f.result.atr14,ref.ATR.calculate({period:14,high:b.map(c=>c.high),low:b.map(c=>c.low),close:values}).at(-1),1e-8);
      console.log(JSON.stringify({symbol:s.symbol,timeframe:f.timeframe,provider:f.provider,bars:b.length,through:f.result.dataThrough,results:comparisons.slice(-4)}));
      if(f.timeframe==='5m'){
        // Diagnostic only: match public technical summaries that may exclude extended hours.
        // Never replace or compare this different-session result as the app's intended output.
        const regular=b.filter(c=>c.sessionKey.endsWith(':regular')),close=regular.map(c=>c.close);
        assert.ok(regular.length>=35);
        console.log(JSON.stringify({kind:'regular-session-reference',symbol:s.symbol,timeframe:'5m',bars:regular.length,through:regular.at(-1).end,close:close.at(-1),ema20:ref.EMA.calculate({period:20,values:close}).at(-1),rsi14:ref.RSI.calculate({period:14,values:close}).at(-1)}));
      }
    }
    const v=s.vwap;assert.ok(v.coverageComplete&&v.value!==null);
    const bars=v.candles.filter(c=>c.start>=v.start&&c.end<=v.end);assert.ok(bars.every(c=>Number.isFinite(c.volume)));
    compare(s.symbol,'session','VWAP',v.value,ref.VWAP.calculate({high:bars.map(c=>c.high),low:bars.map(c=>c.low),close:bars.map(c=>c.close),volume:bars.map(c=>c.volume)}).at(-1),1e-8);
    console.log(JSON.stringify(comparisons.at(-1)));
  }
  assert.equal(comparisons.length,153);
  console.log(JSON.stringify({reference:URL,sha256:HASH,checks:comparisons.length,passed:comparisons.length-failures,failed:failures,maxRsiDifference:Math.max(...comparisons.filter(c=>c.indicator==='RSI14').map(c=>c.difference)),maxPriceDifference:Math.max(...comparisons.filter(c=>c.indicator!=='RSI14').map(c=>c.difference))}));
  process.exitCode=failures?1:0;
}
main().catch(e=>{console.error(e.message);process.exitCode=1;});
