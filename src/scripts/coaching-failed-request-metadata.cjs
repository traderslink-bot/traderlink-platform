// Privacy-bounded Playwright listener. Never reads headers, cookies, body or query strings.
const allowedSegments=new Set('api communities test-community workspace teaching students onboarding manage channels coaching _next static auth discord login callback platform health'.split(' '));
function requestMetadata(request,extra={}){
 let origin='redacted',pathTemplate='/redacted';
 try{const url=new URL(request.url());origin=url.origin==='https://traderlink-platform-staging-staging.up.railway.app'||url.origin==='https://discord.com'?url.origin:'external';pathTemplate='/'+url.pathname.split('/').filter(Boolean).slice(0,12).map(part=>allowedSegments.has(part)?part:':redacted').join('/');}catch{/* Invalid URLs remain redacted. */}
 const details={};
 if(Number.isInteger(extra.status)&&extra.status>=400&&extra.status<=599)details.status=extra.status;
 if(typeof extra.failureCode==='string'&&/^(?:net::ERR_[A-Z_]+|request_failed)$/.test(extra.failureCode))details.failureCode=extra.failureCode;
 const method=request.method(),resourceType=request.resourceType();
 return {atUtc:new Date().toISOString(),origin,pathTemplate,method:['GET','POST','PUT','PATCH','DELETE','HEAD','OPTIONS'].includes(method)?method:'OTHER',resourceType:['document','stylesheet','image','media','font','script','texttrack','xhr','fetch','eventsource','websocket','manifest','other'].includes(resourceType)?resourceType:'other',...details};
}
function captureFailedRequests(page,emit){
 page.on('response',response=>{const status=response.status();if(status>=400)emit(requestMetadata(response.request(),{status}));});
 page.on('requestfailed',request=>{const message=request.failure()?.errorText??'';const code=message.match(/\bnet::ERR_[A-Z_]+\b/)?.[0]??'request_failed';emit(requestMetadata(request,{failureCode:code}));});
}
module.exports={requestMetadata,captureFailedRequests};
if(require.main===module){
 const assert=require('node:assert/strict'),handlers={};const rows=[];
 const request={url:()=> 'https://traderlink-platform-staging-staging.up.railway.app/communities/test-community/workspace/students/PRIVATE-SENTINEL?token=PRIVATE-SENTINEL',method:()=> 'POST',resourceType:()=> 'fetch',failure:()=>({errorText:'net::ERR_FAILED https://private.invalid/PRIVATE-SENTINEL'}),headers:()=>{throw Error('Headers must never be read');},postData:()=>{throw Error('Body must never be read');}};
 captureFailedRequests({on:(event,handler)=>{handlers[event]=handler;}},row=>rows.push(row));
 handlers.response({status:()=>403,request:()=>request});handlers.requestfailed(request);
 assert(!JSON.stringify(requestMetadata(request,{token:'PRIVATE-SENTINEL'})).includes('PRIVATE-SENTINEL'));
 assert.equal(rows.length,2);assert.equal(rows[0].status,403);assert.equal(rows[1].failureCode,'net::ERR_FAILED');assert(!JSON.stringify(rows).includes('PRIVATE-SENTINEL'));assert(!JSON.stringify(rows).includes('?'));assert.equal(requestMetadata({...request,url:()=> 'https://PRIVATE-SENTINEL.invalid/PRIVATE-SENTINEL'}).origin,'external');
 console.log('PASS: failed-request metadata excludes query, private path segments, unknown origins, headers and payloads; synthetic privacy regression only.');
}
