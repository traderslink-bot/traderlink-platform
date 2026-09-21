const assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm'),ts=require('typescript');
function load(p){const m={exports:{}};vm.runInNewContext(ts.transpileModule(fs.readFileSync(p,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText,{module:m,exports:m.exports,Intl,Number,Object});return m.exports;}
const {watchlistIndicatorHelp,WATCHLIST_INDICATOR_HELP}=load('app/watchlist/watchlist-indicator-help.ts');
const {indicatorDisplayRows}=load('src/lib/live-watchlist/indicators/indicator-presentation.ts');
for(const timeframe of ['1m','5m','15m','1d']) {
  const rows=indicatorDisplayRows({timeframe,livePrice:null,vwap:null});assert.equal(rows.length,7);
  for(const row of rows){assert.ok(WATCHLIST_INDICATOR_HELP[row.label],row.label);assert.ok(watchlistIndicatorHelp(row.label,row.calculation).length>80);}
}
assert.ok(watchlistIndicatorHelp('ATR','Calculation detail.').endsWith('Calculation detail.'));
const src=fs.readFileSync('app/watchlist/watchlist-indicators-card.tsx','utf8');
assert.ok(!src.includes('row.calculation ? <Tooltip'));
assert.match(src,/open=\{openHelp === row.label\}/);assert.match(src,/aria-expanded=\{openHelp === row.label\}/);
assert.match(src,/onClick=\{\(\) => setOpenHelp\(current => current === row.label \? null : row.label\)\}/);
assert.match(src,/event.key === "Escape"/);assert.match(src,/onClickAway=\{\(\) => setOpenHelp\(null\)\}/);
assert.match(src,/const select =[^]*?setOpenHelp\(null\)/);
assert.match(src,/disableHoverListener disableFocusListener disableTouchListener/);
console.log('PASS: all seven indicators have help across four unavailable-data timeframes; calculation append, explicit toggle/ARIA, Escape/outside/timeframe dismissal wiring. Browser interaction acceptance remains required.');
