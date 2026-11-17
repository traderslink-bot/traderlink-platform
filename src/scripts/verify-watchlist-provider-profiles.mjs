import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {stripTypeScriptTypes} from 'node:module';
import {SourceTextModule,SyntheticModule,createContext} from 'node:vm';
const context=createContext({process:{env:{}},Object,Number,JSON,Error});
let selected={provider:'alpaca',revision:0}, runtime={profile:'alpaca',revision:1,changing:false,
  roles:{historicalProvider:'alpaca',liveProvider:'alpaca',sameDayCandleProvider:'alpaca'}};
let posts=0,saves=0,failSave=false,lostAck=false,rejectPost=false,malformed=false,moomooReady=true;
const mocks={
  'server-only':{},
  './moomoo-watchlist-candle-bridge':{readSharedMoomooConnectionStatus:()=>({ready:moomooReady})},
  '@/src/modules/market-data/server/provider-settings':{
    marketDataSelection:()=>({...selected}),
    changeMarketDataProvider:async(_feature,revision,provider)=>{
      saves++;if(failSave)throw Error('storage failed');assert.equal(revision,selected.revision);selected={provider,revision:revision+1};return selected;
    },
  },
  './runtime/watchlist-runtime-admin-client':{requestWatchlistRuntimeRaw:async request=>{
    if(request.method==='POST'){
      posts++;const body=JSON.parse(request.body);
      if(rejectPost)return {ok:false,status:503,body:'unavailable'};
      assert.equal(body.expectedRevision,runtime.revision);
      runtime={profile:body.profile,revision:runtime.revision+1,changing:false,
        roles:body.profile==='alpaca'?{historicalProvider:'alpaca',liveProvider:'alpaca',sameDayCandleProvider:'alpaca'}
          :{historicalProvider:'eodhd',liveProvider:'eodhd',sameDayCandleProvider:'moomoo'}};
      if(lostAck)return {ok:false,status:504,body:'timeout'};
    }
    return {ok:true,status:200,body:malformed?JSON.stringify({...runtime,roles:{...runtime.roles,liveProvider:'ibkr'}}):JSON.stringify(runtime)};
  }},
};
const module=new SourceTextModule(stripTypeScriptTypes(await readFile(new URL('../modules/watchlist/server/watchlist-market-data-profile.ts',import.meta.url),'utf8')),{context});
await module.link(name=>{const values=mocks[name];assert.ok(values,name);return new SyntheticModule(Object.keys(values),function(){for(const [key,value]of Object.entries(values))this.setExport(key,value);},{context});});
await module.evaluate();
const {readWatchlistMarketDataProfile:read,changeWatchlistMarketDataProfile:change}=module.namespace;
assert.equal((await read()).synchronized,true);assert.equal(posts,0);assert.equal(saves,0);
let result=await change('previous',1);assert.equal(result.synchronized,true);assert.equal(result.roles.liveProvider,'eodhd');assert.equal(selected.provider,'moomoo');
lostAck=true;result=await change('alpaca',runtime.revision);assert.equal(result.synchronized,true);assert.equal(posts,2);lostAck=false;
failSave=true;await assert.rejects(change('previous',runtime.revision),/storage failed/);
assert.equal(runtime.profile,'previous');assert.equal(selected.provider,'alpaca');
const count=posts;assert.equal((await read()).synchronized,false);assert.equal(posts,count); // GET does not repair by mutation.
failSave=false;result=await change('previous',runtime.revision);assert.equal(result.synchronized,true);
rejectPost=true;await assert.rejects(change('alpaca',runtime.revision),/did not complete/);rejectPost=false;
malformed=true;await assert.rejects(read(),/does not match/);malformed=false;
moomooReady=false;const beforeUnavailable=posts;await assert.rejects(change('previous',runtime.revision),/connection is unavailable/);assert.equal(posts,beforeUnavailable);moomooReady=true;
runtime.persisted=false;assert.equal((await read()).synchronized,false);delete runtime.persisted;
const before=posts;await assert.rejects(change('invalid',runtime.revision),/Invalid/);assert.equal(posts,before);
const operation=change('alpaca',runtime.revision);await assert.rejects(change('previous',runtime.revision),/already in progress/);await operation;
console.log('PASS: profile facade complete-pair acknowledgment, exact previous roles, read-only reads, lost-ack readback, local failure recovery, malformed status, rejected change, invalid input and concurrent change checks. No live I/O.');
