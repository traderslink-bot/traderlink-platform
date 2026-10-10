// Focused reader contract checks with synthetic annotation collaborators; no database writes.
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),vm=require('node:vm'),ts=require('typescript');
const source=fs.readFileSync(path.resolve(__dirname,'../modules/communities/server/traderlink-community-coach-journal-read-service.ts'),'utf8');
const output={}; const dailyReads=[];
class Annotations {
  readDailyNote(_scope,date){dailyReads.push(date);return {whatWorked:`Worked ${date}`,whatNeedsWork:'',technicalRecap:'',tomorrowsFocus:'',anythingElse:''};}
  listRuleReviews(){return [{ruleId:'rule',status:'broken',note:'Synthetic day rule'}];}
  listRuleReviewsForRoundTripsWithRuleTitles(_scope,ids){return ids.map(()=>({ruleTitle:'Risk limit',review:{ruleId:'rule',status:'broken'}}));}
  readRoundTripNotes(_scope,ids){return Object.fromEntries(ids.map(id=>[id,{tradeNote:`Note ${id}`,technicalNote:''}]));}
  listTagsForRoundTrips(_scope,ids){return Object.fromEntries(ids.map(id=>[id,[{name:'Synthetic'}]]));}
}
vm.runInNewContext(ts.transpileModule(source,{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022,esModuleInterop:true}}).outputText,{
  exports:output,require(id){
    if(id==='decimal.js')return require('decimal.js');
    if(id.endsWith('/workspace-access-scope'))return {narrowWorkspaceAccessToAccount:scope=>scope};
    if(id.endsWith('/journal-annotation-service'))return {JournalAnnotationService:Annotations};
    if(id.endsWith('/journal-annotation-repository'))return {JournalAnnotationRepository:class{findTradingDayId(_scope,date){return date;}}};
    if(id.endsWith('/journal-rule-repository'))return {JournalRuleRepository:class{list(){return [{ruleId:'rule',title:'Risk limit'}];}}};
    return {};
  }
});
const reader=new output.TraderLinkCommunityCoachJournalReadService({});
let grant={data_scope:'complete',shared_fields_json:'[]',journal_account_id:'account'};
reader.grant=()=>({grant,scope:{}});
const rows=[['prior','2026-09-22','10','USD'],['a','2026-09-23','20','USD'],['b','2026-09-24','-5','USD'],['c','2026-09-25','7','CAD']].map(([roundTripId,tradingDate,netPnlDecimal,currency])=>({roundTripId,tradingDate,openedAtUtc:`${tradingDate}T14:00:00.000Z`,symbol:'TEST',state:'ready_closed',netPnlDecimal,grossPnlDecimal:netPnlDecimal,currency}));
reader.read=input=>({coverage:'complete',trades:rows.filter(row=>(!input.periodStart||row.tradingDate>=input.periodStart)&&(!input.periodEnd||row.tradingDate<=input.periodEnd))});
const input={coachUserId:'coach',relationshipId:'student',periodStart:'2026-09-23',periodEnd:'2026-09-25',includeRules:true,includeJournal:true,includeDayJournal:true};
const day=reader.readReviewContext(input);
assert.equal(day.dayNotes.length,3);assert.equal(day.dayRules.length,3);
assert.equal(day.rules[0].broken,3);assert.equal(day.journal.length,3);
assert.equal(day.metrics.find(row=>row.currency==='USD').pnl,'15');
assert.equal(day.metrics.find(row=>row.currency==='CAD').pnl,'7');
assert.equal(day.previous[0].pnl,'10');
dailyReads.length=0;
const trades=reader.readReviewContext({...input,includeDayJournal:false,selectedIds:['b']});
assert.equal(trades.tradeCount,1);assert.equal(trades.journal[0].roundTripId,'b');assert.equal(trades.metrics[0].pnl,'-5');assert.equal(trades.previous,null);assert.equal(dailyReads.length,0);
grant={...grant,data_scope:'trades'};
const restricted=reader.readReviewContext(input);
assert.equal(restricted.journal.length,0);assert.equal(restricted.rules.length,0);assert.equal(restricted.dayNotes.length,0);assert.equal(restricted.dayRules.length,0);
grant={...grant,data_scope:'complete'};
assert.equal(reader.readReviewContext({...input,periodStart:undefined,periodEnd:undefined}).dayNotes.length,0);
console.log('PASS: bounded daily notes/rules, selected-trade notes/tags, per-currency comparisons and excluded/unshared data');
