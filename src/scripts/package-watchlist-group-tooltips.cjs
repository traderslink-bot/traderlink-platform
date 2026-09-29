const fs=require('node:fs'),cp=require('node:child_process'),path=require('node:path'),assert=require('node:assert/strict');
const ts=require('C:/Users/jerac/Documents/TraderLink/traderlink-platform/node_modules/typescript');
const parent='13211b4094da196abc934920fe416eb043cc6610',root=process.cwd(),index=path.join(root,'data/watchlist-group-tooltips.index');
function git(args,input){return cp.execFileSync('git',args,{cwd:root,env:{...process.env,GIT_INDEX_FILE:index},encoding:'utf8',input});}
function one(s,a,b){assert.equal(s.split(a).length,2,a);return s.replace(a,b);}
const file='app/watchlist/live-watchlist-client.tsx',raw=git(['show',`${parent}:${file}`]);let text=raw.replace(/\r\n/g,'\n');
text=one(text,'import { WatchlistIndicatorsCard } from "./watchlist-indicators-card";','import { WatchlistIndicatorsCard } from "./watchlist-indicators-card";\nimport groupHelpStyles from "./watchlist-group-help.module.css";');
const general='Stocks being watched for potential opportunities, without a specific trading session or day-trade/swing-trade focus. Open a ticker to view available notes, analysis and price levels.';
const swing='This list focuses on stocks with a recent, active catalyst and floats above 50 million shares—ideally above 100 million. Stocks with an upcoming catalyst may also be included, regardless of float size.';
const block=`                    <details style={{ position: "relative", width: "fit-content" }}>
                      <summary aria-label="About General Watchlist" style={{ cursor: "pointer", listStyle: "none" }}>ⓘ</summary>
                      <p style={{ position: "absolute", zIndex: 20, width: "min(280px, 70vw)", background: "var(--academy-surface)", color: "var(--academy-text)", border: "1px solid var(--academy-border-strong)", borderRadius: 8, padding: 12, boxShadow: "var(--academy-shadow-3)" }}>${general}</p>
                    </details>`;
text=one(text,block.replace(/^  /gm,''),`                  <WatchlistGroupHelp label="General Watchlist" text="${general}" />`);
text=one(text,'                <h2 id="watchlist-swings-heading">Swings</h2>',`                <div>
                  <h2 id="watchlist-swings-heading">Swings</h2>
                  <WatchlistGroupHelp label="Swings" text="${swing}" />
                </div>`);
const component=`function WatchlistGroupHelp({ label, text }: { label: string; text: string }) {
  return (
    <details className={groupHelpStyles.help}>
      <summary className={\`watchlist-card-help \${groupHelpStyles.trigger}\`} aria-label={\`About \${label}\`}>
        ?
      </summary>
      <p className={groupHelpStyles.content}>{text}</p>
    </details>
  );
}

`;
text=one(text,'const LEGACY_WATCHLIST_READ_ENABLED = false;',component+'const LEGACY_WATCHLIST_READ_ENABLED = false;');
const output=ts.transpileModule(text,{fileName:file,reportDiagnostics:true,compilerOptions:{target:ts.ScriptTarget.ES2022,module:ts.ModuleKind.CommonJS,jsx:ts.JsxEmit.ReactJSX}});
assert.equal(output.diagnostics.filter(d=>d.category===ts.DiagnosticCategory.Error).length,0);
assert.equal(text.split('<WatchlistGroupHelp label=').length-1,2);assert.ok(text.includes(`text="${swing}"`));assert.ok(!text.includes('>ⓘ</summary>'));
console.log('PASS: TSX syntax, both native interactive help controls, exact approved Swings text, original General text and shared question-mark styling.');
if(process.argv.includes('--commit')){
 git(['read-tree',parent]);const write=(f,body)=>{const blob=git(['hash-object','-w','--stdin'],body).trim();git(['update-index','--add','--cacheinfo',`100644,${blob},${f}`]);};
 write(file,raw.includes('\r\n')?text.replace(/\n/g,'\r\n'):text);
 for(const f of ['app/watchlist/watchlist-group-help.module.css','docs/migration/watchlist-group-tooltips-progress.md','src/scripts/package-watchlist-group-tooltips.cjs'])write(f,fs.readFileSync(f));
 const plan='docs/migration/watchlist-swings-plan.md';write(plan,git(['show',`${parent}:${plan}`])+'\n\nOwner-approved General/Swings tooltip follow-up: [progress](watchlist-group-tooltips-progress.md). Implemented locally; deployment and visual acceptance pending.\n');
 git(['diff','--cached','--check',parent]);const tree=git(['write-tree']).trim(),commit=git(['commit-tree',tree,'-p',parent,'-m','Match General and Swings help icons to Potential Path']).trim();git(['update-ref','refs/codex/watchlist-group-tooltips',commit]);console.log(JSON.stringify({parent,commit}));console.log(git(['diff-tree','--no-commit-id','--name-only','-r',commit]));
}
