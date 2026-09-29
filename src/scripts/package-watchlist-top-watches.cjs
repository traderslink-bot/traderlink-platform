const cp=require('node:child_process'),fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const ts=require('C:/Users/jerac/Documents/TraderLink/traderlink-platform/node_modules/typescript');
const root=process.cwd(),runtime='C:/Users/jerac/.codex/worktrees/watchlist-source-selector/levels-system-post-mtf-handoff-stability';
const parents={platform:'e22000fcb5811577bff9cd80628cda3f13dfb682',runtime:'a6289ccfa4dafa3e04898348560bf17deaf1e612'};
const changes={platform:new Map(),runtime:new Map()};
function git(cwd,args,input,index){return cp.execFileSync('git',['-c',`safe.directory=${cwd.replaceAll('\\','/')}`,...args],{cwd,env:{...process.env,...(index?{GIT_INDEX_FILE:index}:{})},encoding:'utf8',input});}
function one(s,a,b){assert.equal(s.split(a).length,2,a);return s.replace(a,b);}
function add(lane,file,after){changes[lane].set(file,{after,crlf:false});}
function edit(lane,file,fn){const raw=git(lane==='platform'?root:runtime,['show',`${parents[lane]}:${file}`]);const before=raw.replace(/\r\n/g,'\n'),after=fn(before);assert.notEqual(before,after,file);changes[lane].set(file,{before,after,crlf:raw.includes('\r\n')});}
function groupContracts(s,importPath){
 s=s.replaceAll('| "swings";', '| "swings" | `top_watches:${string}`;').replaceAll('| "swings" | undefined','| "swings" | `top_watches:${string}` | undefined');
 const old=s;
 s=s.replace(/([\w.]+) === "swings"/g,'$1 === "swings" || isTopWatchesGroup($1)').replace(/([\w.]+) !== "swings"/g,'$1 !== "swings" && !isTopWatchesGroup($1)');
 if(s!==old)s=`import { isTopWatchesGroup } from "${importPath}";\n`+s;
 return s;
}
const pf=['src/lib/live-watchlist/live-watchlist-session-group.ts','src/lib/live-watchlist/live-watchlist-store.ts','src/lib/live-watchlist/live-watchlist-types.ts'];
const rf=['src/lib/live-watchlist/live-watchlist-audit-archive.ts','src/lib/live-watchlist/live-watchlist-publisher.ts','src/lib/live-watchlist/live-watchlist-types.ts','src/lib/monitoring/manual-watchlist-runtime-manager.ts','src/lib/monitoring/monitoring-types.ts','src/lib/monitoring/watchlist-entry-session.ts','src/lib/monitoring/watchlist-state-persistence.ts','src/lib/monitoring/watchlist-store.ts'];
for(const f of pf)edit('platform',f,s=>groupContracts(s,'./top-watches-group'));
for(const f of rf)edit('runtime',f,s=>groupContracts(s,f.includes('/monitoring/')?'../live-watchlist/top-watches-group.js':'./top-watches-group.js'));
for(const lane of ['platform','runtime'])add(lane,'src/lib/live-watchlist/top-watches-group.ts',fs.readFileSync('src/lib/live-watchlist/top-watches-group.ts','utf8'));
add('runtime','src/lib/monitoring/top-watches-calendar.ts',fs.readFileSync('src/scripts/fixtures/top-watches-calendar.ts.txt','utf8'));
edit('platform','app/watchlist/live-watchlist-client.tsx',s=>{
 s=one(s,'import groupHelpStyles from "./watchlist-group-help.module.css";','import groupHelpStyles from "./watchlist-group-help.module.css";\nimport { isTopWatchesGroup, topWatchesLabel } from "@/src/lib/live-watchlist/top-watches-group";');
 const anchor='  const swingSymbols = activeSymbols.filter(symbol => getLiveWatchlistEntryGroup(symbol) === "swings");';
 s=one(s,anchor,anchor+'\n  const datedTopGroups = [...new Set(activeSymbols.map(getLiveWatchlistEntryGroup).filter(isTopWatchesGroup))].sort();');
 const section=`          {datedTopGroups.map(group => {
            const members = activeSymbols.filter(symbol => getLiveWatchlistEntryGroup(symbol) === group);
            const heading = topWatchesLabel(group);
            return (
              <section key={group} className="watchlist-session-list" aria-labelledby={group}>
                <div className="watchlist-session-heading">
                  <h2 id={group} title={group.slice(12)}>{heading}</h2>
                  <span>{members.length}</span>
                </div>
                <WatchlistTickerTable marketDataStatus={marketDataStatus} ariaLabel={heading + " (" + group.slice(12) + ") tickers"} symbols={members} reverseSplits={reverseSplits} />
              </section>
            );
          })}
`;
 s=one(s,'          {swingSymbols.length > 0 ? (',section+'          {swingSymbols.length > 0 ? (');
 s=one(s,'{swingSymbols.length} swings','{swingSymbols.length} swings / {activeSymbols.filter(symbol => isTopWatchesGroup(getLiveWatchlistEntryGroup(symbol))).length} top watches');
 return s;
});
edit('runtime','src/runtime/manual-watchlist-server.ts',s=>{
 s=groupContracts(s,'../lib/live-watchlist/top-watches-group.js');
 s='import { upcomingTopWatchesGroup } from "../lib/monitoring/top-watches-calendar.js";\nimport { getUsEquityTradingDay as topWatchesTradingDay } from "../lib/market-data/us-equity-exchange-calendar.js";\n'+s;
 // New dated destinations must be actual trading dates, not only syntactically valid dates.
 s=s.replaceAll('isTopWatchesGroup(body.watchlistGroup)','(isTopWatchesGroup(body.watchlistGroup) && topWatchesTradingDay(body.watchlistGroup.slice(12)).isTradingDay)');
 s=one(s,'activeEntries: manager.getActiveEntries().map((entry) => ({','upcomingTopWatchesGroup: upcomingTopWatchesGroup(),\n        activeEntries: manager.getActiveEntries().map((entry) => ({');
 return s;
});
edit('runtime','src/runtime/manual-watchlist-page.ts',s=>{
 s=one(s,'<option value="swings">Swings</option>','<option value="swings">Swings</option>\n        <option id="top-watches-add-option" value="" disabled>Top Watches (loading date)</option>');
 s=one(s,'        <ul id="swings-list"></ul>','        <ul id="swings-list"></ul>\n      </div>\n      <div id="dated-top-watches-lists">');
 // Browser helper mirrors only validation/formatting; calendar selection remains server-owned.
 const helper=`    function isTopWatchesGroup(value) {
      if (typeof value !== "string" || !/^top_watches:\\d{4}-\\d{2}-\\d{2}$/.test(value)) return false;
      const date = value.slice(12), time = Date.parse(date + "T12:00:00Z");
      return Number.isFinite(time) && new Date(time).toISOString().slice(0, 10) === date;
    }
    function topWatchesLabel(group) {
      return "Top Watches · " + new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric", timeZone: "UTC" }).format(new Date(group.slice(12) + "T12:00:00Z"));
    }
    let upcomingTopWatchesGroup = null;
    let availableTopWatchesGroups = [];
`;
 // This file is a template string: retain regex backslashes when it becomes HTML.
 s=one(s,'    function entryWatchlistGroup(entry) {',helper.replaceAll('\\','\\\\')+'\n    function entryWatchlistGroup(entry) {');
 s=one(s,'entry.watchlistGroup === "swings"','entry.watchlistGroup === "swings" || isTopWatchesGroup(entry.watchlistGroup)');
 s=one(s,'    function renderEntries(entries) {',`    function renderEntries(entries) {
      for (const key of Object.keys(listEls)) if (isTopWatchesGroup(key)) delete listEls[key];
      const datedContainer = document.getElementById("dated-top-watches-lists");
      datedContainer.replaceChildren();
      availableTopWatchesGroups = [...new Set(entries.map(entryWatchlistGroup).filter(isTopWatchesGroup).concat(upcomingTopWatchesGroup ? [upcomingTopWatchesGroup] : []))].sort();
      for (const group of availableTopWatchesGroups) {
        if (!entries.some(entry => entryWatchlistGroup(entry) === group)) continue;
        const section = document.createElement("div"); section.className = "watchlist-admin-group";
        const heading = document.createElement("div"); heading.className = "watchlist-group-heading";
        const title = document.createElement("h3"); title.textContent = topWatchesLabel(group); title.title = group.slice(12);
        const clear = document.createElement("button"); clear.type = "button"; clear.className = "danger"; clear.textContent = "Clear " + topWatchesLabel(group);
        clear.addEventListener("click", () => deactivateTickerGroup(group, topWatchesLabel(group)));
        heading.append(title, clear); const list = document.createElement("ul"); listEls[group] = list;
        section.append(heading, list); datedContainer.appendChild(section);
      }`);
 s=one(s,'            ["swings", "Swings"],','            ["swings", "Swings"],\n            ...availableTopWatchesGroups.map(group => [group, topWatchesLabel(group)]),');
 s=one(s,'      renderEntries(payload.activeEntries || []);',`      upcomingTopWatchesGroup = isTopWatchesGroup(payload.upcomingTopWatchesGroup) ? payload.upcomingTopWatchesGroup : null;
        const selectedGroup = watchlistGroupEl.value;
        const topOption = document.getElementById("top-watches-add-option");
        if (topOption) topOption.remove();
        for (const option of [...watchlistGroupEl.options]) if (isTopWatchesGroup(option.value)) option.remove();
        renderEntries(payload.activeEntries || []);
        const addDates = [...new Set(availableTopWatchesGroups.concat(isTopWatchesGroup(selectedGroup) ? [selectedGroup] : []))].sort();
        for (const group of addDates) {
          const option = document.createElement("option"); option.value = group; option.textContent = topWatchesLabel(group); option.title = group.slice(12);
          watchlistGroupEl.appendChild(option);
        }
        // Keep the owner's selected date while making the upcoming date available too.
        if ([...watchlistGroupEl.options].some(option => option.value === selectedGroup)) watchlistGroupEl.value = selectedGroup;`);
 return s;
});
edit('platform','src/modules/help/watchlist-guides.ts',s=>one(s,'Choosing this list does not change how analysis is generated.','Choosing this list does not change how analysis is generated. Top Watches uses a fixed trading-date heading, such as Top Watches · Sep 30. Add or move a ticker into the dated group in Admin. The next session is selected using the market calendar; existing groups keep their date, including when viewed the following day.'));
edit('platform','docs/migration/watchlist-swings-plan.md',s=>s+'\n\nDated Top Watches is a separate owner-approved grouping: [plan](watchlist-top-watches-plan.md) and [progress](watchlist-top-watches-progress.md). Swings behavior remains unchanged.\n');
for(const [lane,files] of Object.entries(changes))for(const [file,{after}] of files){if(!/\.tsx?$/.test(file))continue;const out=ts.transpileModule(after,{fileName:file,reportDiagnostics:true,compilerOptions:{target:ts.ScriptTarget.ES2022,module:ts.ModuleKind.CommonJS,jsx:ts.JsxEmit.ReactJSX}});assert.equal(out.diagnostics.filter(d=>d.category===ts.DiagnosticCategory.Error).length,0,file);}
console.log('Top Watches exact-parent source transforms and syntax checks passed.');
if(process.argv.includes('--commit') || process.argv.includes('--prepare'))for(const [lane,files] of Object.entries(changes)){
 const cwd=lane==='platform'?root:runtime,parent=parents[lane],index=path.join(root,`data/top-watches-${lane}.index`);git(cwd,['read-tree',parent],undefined,index);
 const write=(file,body)=>{const blob=git(cwd,['hash-object','-w','--stdin'],body,index).trim();git(cwd,['update-index','--add','--cacheinfo',`100644,${blob},${file}`],undefined,index);};
 for(const [file,{after,crlf}] of files)write(file,crlf?after.replace(/\n/g,'\r\n'):after);
 if(lane==='platform')for(const f of ['docs/migration/watchlist-top-watches-plan.md','docs/migration/watchlist-top-watches-progress.md','src/scripts/package-watchlist-top-watches.cjs','src/scripts/verify-watchlist-top-watches.cjs','src/scripts/fixtures/top-watches-calendar.ts.txt'])write(f,fs.readFileSync(f));
 git(cwd,['diff','--cached','--check',parent],undefined,index);
 if(process.argv.includes('--commit')) {const tree=git(cwd,['write-tree'],undefined,index).trim(),commit=git(cwd,['commit-tree',tree,'-p',parent,'-m','Add fixed-date Top Watches groups using exchange calendar'],undefined,index).trim();git(cwd,['update-ref',`refs/codex/watchlist-top-watches-${lane}`,commit],undefined,index);console.log(JSON.stringify({lane,parent,commit}));}
 console.log(git(cwd,['diff','--cached','--stat',parent],undefined,index));
}
module.exports={changes,parents,runtime,git};
