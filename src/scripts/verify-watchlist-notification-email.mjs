import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import vm from 'node:vm';
const require=createRequire(process.env.TRADERLINK_FOCUSED_DEPENDENCY_PACKAGE || new URL('../../package.json',import.meta.url));
const ts=require('typescript');
const load=name=>{
  const module={exports:{}};
  const source=ts.transpileModule(readFileSync(`src/modules/platform/server/notifications/${name}.ts`,'utf8'),{
    compilerOptions:{target:ts.ScriptTarget.ES2022,module:ts.ModuleKind.CommonJS}}).outputText;
  vm.runInNewContext(`(function(require,module,exports){${source}\n})`,{URL,AbortSignal,process,Buffer})(
    id=>id==='server-only'?{}:load(id.replace('./','')),module,module.exports);
  return module.exports;
};
const {deliverPlatformNotificationEmail:send}=load('platform-resend-notification-email');
let requests=[];
const input={environment:{RESEND_API_KEY:'test_key_not_a_real_secret_12345',PLATFORM_PUBLIC_ORIGIN:'https://app.traderslink.pro'},
  emailAddress:'fixture@example.test',idempotencyKey:'watchlist:fixture',actionLabel:'View YFOR',
  content:{title:'YFOR added to the TradersLink Watchlist',summary:'A new Watchlist post for YFOR is ready.',destinationPath:'/watchlist/YFOR'},
  additionalLinks:[{label:'View Watchlist',path:'/watchlist'},{label:'Manage notifications',path:'/account/preferences'}],
  fetcher:async (url,options)=>{requests.push({url,...options});return new Response('',{status:200});}};
assert.equal((await send(input)).ok,true);
const payload=JSON.parse(requests[0].body);
assert.match(payload.html,/href="https:\/\/app.traderslink.pro\/watchlist\/YFOR"/);
assert.match(payload.html,/href="https:\/\/app.traderslink.pro\/watchlist">View Watchlist/);
assert.match(payload.text,/Manage notifications: https:\/\/app.traderslink.pro\/account\/preferences/);
assert.doesNotMatch(payload.html,/<img|attachment|base64/);
assert.equal(requests[0].headers['Idempotency-Key'],'watchlist:fixture');
assert.equal((await send({...input,additionalLinks:[{label:'bad',path:'//elsewhere.test'}]})).code,'invalid_destination');
assert.equal(requests.length,1);
assert.equal((await send({...input,additionalLinks:undefined})).ok,true);
assert.doesNotMatch(JSON.parse(requests[1].body).html,/View Watchlist|Manage notifications/);
assert.equal((await send({...input,fetcher:async()=>new Response('',{status:429})})).code,'provider_unavailable');
console.log('PASS: exact Watchlist links/copy, no images, stable email idempotency, unsafe link rejection, unchanged ordinary email template and retryable throttling. Mocked HTTP only.');
