// Explicit owner-authorized production acceptance, 2026-09-12 only.
// Run through stdin in the existing Platform container. No direct DB writes,
// runtime mutations, AI calls, Discord requests, settings or deployments.
const fs = require('node:fs');
const assert = require('node:assert/strict');
const symbols = ['TRUG','TNON','AENT','FTFT','FEIM','BDRX','SURG','SXTC','PCLA'];
const backupPath = '/tmp/watchlist-indicator-acceptance-20260912-postfix.json';
const mode = process.argv[2];
if (!['publish','inspect','audit','yahoo','restore'].includes(mode)) throw Error('Explicit acceptance mode required');
if (new Date().toISOString().slice(0,10) !== '2026-09-12') throw Error('Acceptance authorization date expired');
const D = require('better-sqlite3');
const db = new D(process.env.TRADERLINK_PLATFORM_DB_PATH,{readonly:true,fileMustExist:true});
db.pragma('query_only=ON');
const current = symbol => { const row=db.prepare('SELECT state_json FROM live_watchlist_symbols WHERE symbol=?').get(symbol); return row ? JSON.parse(row.state_json) : null; };
const origin = 'http://127.0.0.1:' + (process.env.PORT || '3000');
const token = process.env.TRADERSLINK_WATCHLIST_PUBLISHER_TOKEN;
assert.ok(token);
async function post(path,body) {
  assert.ok(['/api/live-watchlist/ingest','/api/live-watchlist/indicators/refresh'].includes(path));
  const r=await fetch(new URL(path,origin),{method:'POST',redirect:'error',headers:{authorization:'Bearer '+token,'content-type':'application/json'},body:JSON.stringify(body),signal:AbortSignal.timeout(20000)});
  if (!r.ok) throw Error('Acceptance HTTP '+r.status);
  return r.json();
}
const cardKinds=['companyInfo','levelMap','fullLadder','nearestSupportResistance','liveTraderRead','tradersLinkAiRead','marketStructure','technicalContext','recentNewsFilings','extendedQuote'];
async function main() {
  if(mode==='yahoo'){
    for(const interval of ['5m','15m']){
      const end=Date.now(),start=end-(interval==='15m'?14:7)*86400000;
      const q=new URLSearchParams({interval,period1:String(Math.floor(start/1000)),period2:String(Math.ceil(end/1000)),includePrePost:'true',events:'splits',includeAdjustedClose:'false'});
      const r=await fetch('https://query1.finance.yahoo.com/v8/finance/chart/FEIM?'+q,{redirect:'error',signal:AbortSignal.timeout(15000)});
      const x=await r.json(),v=x.chart?.result?.[0],b=v?.indicators?.quote?.[0];
      const issues=[];
      for(let i=0;i<(v?.timestamp?.length||0);i++){
        const t=v.timestamp[i],o=b.open[i],h=b.high[i],l=b.low[i],c=b.close[i],vol=b.volume[i];
        if([o,h,l,c,vol].every(a=>a===null))continue;
        const reason=t%60?'non_minute_timestamp':[o,h,l,c].some(a=>a==null)?'partial_null_ohlc':Math.min(o,h,l,c)<=0?'non_positive_price':h<Math.max(o,c,l)||l>Math.min(o,c)?'ohlc_geometry':vol<0?'negative_volume':null;
        if(reason)issues.push({index:i,timestamp:t,reason,ohlcv:[o,h,l,c,vol]});
      }
      console.log(JSON.stringify({interval,status:r.status,timezone:v?.meta?.exchangeTimezoneName,bars:v?.timestamp?.length,issueCount:issues.length,examples:issues.slice(0,3)}));
    }
    return;
  }
  if (mode === 'audit') {
    const path=require('node:path'),zlib=require('node:zlib');
    const root=path.join(path.dirname(process.env.TRADERLINK_PLATFORM_DB_PATH),'watchlist-indicator-audit');
    const names=fs.readdirSync(root).filter(n=>/^\d{13}_[a-f0-9-]{36}\.json$/.test(n));
    const since=JSON.parse(fs.readFileSync(backupPath,'utf8')).createdAt;
    const records=names.map(n=>JSON.parse(fs.readFileSync(path.join(root,n),'utf8'))).filter(r=>symbols.includes(r.symbol)&&r.queuedAt>=since);
    const transports=new Set(records.flatMap(r=>r.attempts.map(a=>a.transportId).filter(Boolean)));
    console.log(JSON.stringify({recordCount:records.length,distinctTransportRequests:transports.size,outcomes:records.reduce((a,r)=>(a[r.outcome]=(a[r.outcome]||0)+1,a),{})}));
    for (const symbol of symbols) {
      const r=records.filter(r=>r.symbol===symbol&&r.timeframes.length).sort((a,b)=>b.queuedAt-a.queuedAt)[0];
      const snapshotName=r&&fs.readdirSync(root).find(n=>n.endsWith('_'+r.calculationId+'.json.gz'));
      const evidence=snapshotName?JSON.parse(zlib.gunzipSync(fs.readFileSync(path.join(root,snapshotName)))):null;
      let checked=0;
      for (const f of evidence?.timeframes||[]) {
        // Fresh warm-up: independent batch EMA, RSI and ATR arithmetic.
        assert.ok(f.initialCheckpoint===null||f.initialCheckpoint.count===0); const b=f.candles;
        const ema=p=>{let v=b.slice(0,p).reduce((s,c)=>s+c.close,0)/p;for(const c of b.slice(p))v+=(c.close-v)*2/(p+1);return v;};
        for(const p of [9,20]){assert.ok(Math.abs(f.result['ema'+p]-ema(p))<1e-8);checked++;}
        let gain=0,loss=0,tr=0;
        for(let i=1;i<b.length;i++){
          const delta=b[i].close-b[i-1].close,g=Math.max(delta,0),l=Math.max(-delta,0),range=Math.max(b[i].high-b[i].low,Math.abs(b[i].high-b[i-1].close),Math.abs(b[i].low-b[i-1].close));
          if(i<=14){gain+=g;loss+=l;tr+=range;if(i===14){gain/=14;loss/=14;tr/=14;}}
          else{gain=(gain*13+g)/14;loss=(loss*13+l)/14;tr=(tr*13+range)/14;}
        }
        const rsi=gain===0&&loss===0?50:loss===0?100:100-100/(1+gain/loss);
        assert.ok(Math.abs(f.result.rsi14-rsi)<1e-8);assert.ok(Math.abs(f.result.atr14-tr)<1e-8);checked+=2;
      }
      const v=evidence?.vwap;
      if(v?.coverageComplete&&v.value!==null){const bars=v.candles.filter(c=>c.start>=v.start&&c.end<=v.end);const vol=bars.reduce((s,c)=>s+c.volume,0);const expected=bars.reduce((s,c)=>s+(c.high+c.low+c.close)/3*c.volume,0)/vol;assert.ok(Math.abs(expected-v.value)<1e-8);checked++;}
      console.log(JSON.stringify({symbol,outcome:r?.outcome,frames:r?.timeframes,independentNumericalChecks:checked,calculationRetained:!!evidence}));
    }
    return;
  }
  if (mode === 'inspect') {
    console.log(JSON.stringify(symbols.map(symbol=>{const s=current(symbol);return {symbol,status:s?.status,firstPostedAt:s?.firstPostedAt,price:s?.latestPrice,cardNames:Object.keys(s?.cards||{})};})));
    return;
  }
  if (mode === 'publish') {
    assert.equal(fs.existsSync(backupPath),false,'Acceptance already initialized; inspect/restore first');
    const u=new URL('/api/watchlist',process.env.TRADERLINK_WATCHLIST_RUNTIME_URL);
    const r=await fetch(u,{headers:{authorization:'Bearer '+process.env.TRADERLINK_WATCHLIST_RUNTIME_ACCESS_TOKEN},redirect:'error',signal:AbortSignal.timeout(20000)});
    assert.ok(r.ok);const runtime=await r.json();
    const entries=symbols.map(symbol=>runtime.activeEntries.find(e=>e.symbol===symbol));
    const saved=symbols.map(symbol=>({symbol,state:current(symbol)}));
    for (let i=0;i<symbols.length;i++) {
      assert.ok(entries[i]?.active && Number.isSafeInteger(entries[i].activatedAt));
      assert.ok(Number.isFinite(entries[i].lastPrice) && entries[i].lastPrice>0);
      assert.ok(!saved[i].state || saved[i].state.status==='deactivated','Existing public ticker must not be replaced');
    }
    fs.writeFileSync(backupPath,JSON.stringify({saved,entries,createdAt:Date.now()}),{flag:'wx',mode:0o600});
    for (const e of entries) {
      const observed=e.lastPriceUpdateAt;
      assert.ok(Number.isSafeInteger(observed));
      const cards=Object.fromEntries(cardKinds.map(k=>[k,null]));
      cards.companyInfo={title:e.symbol+' — Indicator test',body:'Temporary closed-market indicator verification using Friday, September 11 market data. Not a new Watchlist analysis.',updatedAt:observed,priceWhenPosted:e.lastPrice,source:'owner-authorized-indicator-acceptance'};
      await post('/api/live-watchlist/ingest',{symbol:e.symbol,status:'live',updatedAt:Date.now(),firstPostedAt:e.activatedAt,watchlistGroup:e.watchlistGroup||'main',potentialGainCardVisible:false,tradersLinkAiReadCardVisible:false,watchlistLifecycleLabelsVisible:false,cards});
      const q=await post('/api/live-watchlist/indicators/refresh',{symbol:e.symbol,activatedAt:e.activatedAt});
      console.log(JSON.stringify({symbol:e.symbol,websiteTestPublished:true,refresh:q.status,discordCalls:0,aiCalls:0}));
    }
    return;
  }
  const backup=JSON.parse(fs.readFileSync(backupPath,'utf8'));
  assert.deepEqual(backup.saved.map(x=>x.symbol),symbols);
  for (const {symbol,state} of backup.saved) {
    const now=current(symbol),entry=backup.entries.find(e=>e.symbol===symbol);
    if (now?.status==='deactivated' && now.firstPostedAt===(state?.firstPostedAt??null)) { console.log(JSON.stringify({symbol,alreadyRestored:true}));continue; }
    assert.equal(now?.firstPostedAt,entry.activatedAt,'Concurrent publication: stop restoration');
    assert.equal(now?.cards?.companyInfo?.source,'owner-authorized-indicator-acceptance','Concurrent card change: stop restoration');
    const cards=Object.fromEntries(cardKinds.map(k=>[k,state?.cards[k]||null]));
    await post('/api/live-watchlist/ingest',{...state,symbol,firstPostedAt:state?.firstPostedAt??null,status:'deactivated',updatedAt:Date.now(),cards});
    const restored=current(symbol);
    assert.equal(restored.status,'deactivated');assert.equal(restored.firstPostedAt,state?.firstPostedAt??null);
    assert.deepEqual(restored.cards,state?.cards??{});
    console.log(JSON.stringify({symbol,restoredInactive:true,originalCardsPreserved:true}));
  }
  console.log('Test public visibility removed; original card content restored. Private backup retained. Runtime reviews/settings untouched.');
}
main().catch(error=>{console.error(error.message);process.exitCode=1;}).finally(()=>db.close());
