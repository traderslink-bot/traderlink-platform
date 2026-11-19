const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm'),ts=require('typescript');
test('Free Chat preparation failure cannot veto initial Watchlist approval and custom copies never enter the paid Runtime payload',async()=>{
 const requests=[];let copySeen;
 const ports={
  '@/src/modules/watchlist/server/access/watchlist-dashboard-navigation-access':{hasWatchlistDashboardNavigationAccess:()=>true},
  '@/src/modules/platform/server/authentication/require-platform-request-scope':{requireTraderLinkPlatformRequestIdentity:()=>({})},
  '@/src/modules/watchlist/server/access/watchlist-admin-authorization':{withWatchlistAdminDatabase:(_h,fn)=>fn(null,{userId:'owner'})},
  '@/src/modules/platform/server/administration/platform-admin-request-security':{requireJournalAdminMutationRequest:()=>{}},
  '@/src/modules/watchlist/server/notifications/watchlist-x-runtime':{recordXApprovalIntent:()=>null},
  '@/src/modules/watchlist/server/notifications/watchlist-free-chat-runtime':{recordFreeChatApprovalIntent:body=>{copySeen=JSON.parse(body).freeChatCopy;throw Error('Synthetic queue unavailable');}},
  '@/src/modules/watchlist/server/notifications/watchlist-notification-runtime':{recordWatchlistApprovalNotificationIntent:()=>{}},
  '@/src/modules/watchlist/server/runtime/watchlist-runtime-admin-client':{requestWatchlistRuntimeRaw:async req=>{requests.push(req);return{ok:true,status:200,contentType:'application/json',body:JSON.stringify({approved:true})};}},
 };
 const exports={};vm.runInNewContext(ts.transpileModule(fs.readFileSync('app/api/admin/watchlist/runtime/[...path]/route.ts','utf8'),{compilerOptions:{target:ts.ScriptTarget.ES2022,module:ts.ModuleKind.CommonJS}}).outputText,{exports,require:key=>ports[key]??{},URL,Response,Request,Headers,console:{error:()=>{}}});
 const input={symbol:'TEST',cycleId:'cycle',draftRevision:2,expectedHead:5,notifyUsers:true,discordText:'Separate Watchlist text',freeChat:true,freeChatCopy:{message:'Separate Free Chat text',visibilityKey:'010',cycleId:'cycle',draftRevision:2}};
 const response=await exports.POST(new Request('https://fixture.invalid/api/admin/watchlist/runtime/watchlist/analysis-review/approve',{method:'POST',body:JSON.stringify(input),headers:{'content-type':'application/json'}}),{params:Promise.resolve({path:['watchlist','analysis-review','approve']})});
 assert.equal(response.status,200);const value=await response.json();assert.equal(value.approved,true);assert.match(value.freeChatWarning,/publication is unchanged/);assert.equal(copySeen.message,'Separate Free Chat text');assert.equal(requests.length,1);
 const paid=JSON.parse(requests[0].body);assert.equal(paid.freeChatCopy,undefined);assert.equal(paid.freeChat,undefined);assert.equal(paid.discordText,'Separate Watchlist text');assert.equal(paid.notifyUsers,true);assert.equal(paid.draftRevision,2);
});
