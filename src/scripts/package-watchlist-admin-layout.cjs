const cp=require('node:child_process'),assert=require('node:assert/strict');
const runtime='C:/Users/jerac/Documents/TraderLink/levels-system-post-mtf-handoff-stability';
const parents={platform:'2aa651ecbdd261ed0eb5ce1ed72f3fd51987bffb',runtime:'6a552ca8dde2edd7da2c0a40979cecaae3026891'};
const read=(lane,p)=>cp.execFileSync('git',['-c',`safe.directory=${runtime}`,...(lane==='runtime'?['-C',runtime]:[]),'show',`${parents[lane]}:${p}`],{encoding:'utf8',maxBuffer:20e6});
function once(s,a,b){assert.equal(s.split(a).length,2,a);return s.replace(a,b);}
function prepare(){
 const maps={platform:new Map(),runtime:new Map()};
 let p='src/runtime/manual-watchlist-row-review.ts',s=read('runtime',p);
 s=once(s,'</style>',`.watchlist-action-section { min-width:0; padding:10px 0; border-bottom:1px solid #e2e8f0; }
.watchlist-action-section > h4 { margin:0 0 8px; font-size:13px; font-weight:700; }
.watchlist-action-section:has(> .watchlist-action-group:only-of-type:empty) { display:none; }
.watchlist-access-controls { display:grid; grid-template-columns:repeat(2,minmax(0,1fr)); gap:8px 16px; width:100%; }
.watchlist-access-option { display:flex; flex-direction:column; gap:4px; min-width:0; }
.watchlist-access-option label { display:flex; align-items:center; gap:6px; margin:0; }
.watchlist-access-option small:empty { display:none; }
.watchlist-action-move { display:grid; grid-template-columns:minmax(160px,260px) auto; justify-content:start; }
.watchlist-action-move > label { grid-column:1 / -1; }
.watchlist-action-move > button { justify-self:start; }
.watchlist-diagnostics .meta { overflow-wrap:anywhere; }
@media(max-width:600px) {
 .watchlist-access-controls { grid-template-columns:1fr; }
 .watchlist-action-move { grid-template-columns:minmax(0,1fr) auto; width:100%; }
 .watchlist-action-move > select { width:100%; }
 .watchlist-action-group > button { max-width:100%; white-space:normal; }
}
</style>`);
 s=once(s,"const review=make('Review and publish'),options=make('Publishing options'),listing=make('Publish without analysis'),move=make('Move ticker'),more=make('More actions'),remove=make('Remove ticker');",`const review=make('Review and publish'),options=make('Publishing options'),listing=make('Publish without analysis'),move=make('Move ticker'),more=make('Posting'),remove=make('Remove ticker'),access=make('Access'),settings=make('Settings'),diagnostics=make('Diagnostics');
    access.classList.add('watchlist-access-controls'); diagnostics.classList.add('watchlist-diagnostics');
    const section=(title,...groups)=>{const box=document.createElement('section'),heading=document.createElement('h4');box.className='watchlist-action-section';heading.textContent=title;box.append(heading,...groups);return box;};
    for(const detail of header.querySelectorAll('.meta:not(.error-line)')) diagnostics.append(detail);`);
 s=once(s,"details.append(summary,more,remove);","details.append(summary,section('Access',access),section('Move',move),section('Posting',options,more),section('Settings',settings),section('Diagnostics',diagnostics),section('Remove',remove));");
 s=once(s,'root.append(review,options,listing,move,details);return {review,options,listing,move,more,remove,header};','root.append(review,listing,details);return {review,options,listing,move,more,remove,header,access,settings,diagnostics};');
 maps.runtime.set(p,s);
 p='src/runtime/manual-watchlist-page.ts';s=read('runtime',p);
 for(const name of ['refreshButton','aiVisibilityButton','indicatorVisibilityButton','dipBuyPlanVisibilityButton'])s=once(s,`actionGroups.more.appendChild(${name});`,`actionGroups.settings.appendChild(${name});`);
 s=once(s,'actionGroups.more.appendChild(aiRefreshButton);','actionGroups.review.appendChild(aiRefreshButton);');
 s=once(s,'actionGroups.more.appendChild(retryButton);','actionGroups.review.appendChild(retryButton);');
 s=once(s,'actionGroups.more.appendChild(copyButton);','actionGroups.diagnostics.appendChild(copyButton);');
 s=once(s,'actionGroups.more.append(moveDetails);','actionGroups.move.append(moveDetails);');
 maps.runtime.set(p,s);
 p='src/modules/watchlist/server/runtime/watchlist-premium-control.ts';s=read('platform',p);
 s=once(s,"label.append(input,document.createTextNode('Premium-only ' + control)); container.append(label,message);",`label.append(input,document.createTextNode('Premium-only ' + control));
  const option=document.createElement('div');option.className='watchlist-access-option';option.append(label,message);container.append(option);`);
 s=once(s,"window.watchlistPremiumControl = (symbol,container) => { attach(symbol,container,'ticker'); attach(symbol,container,'analysis'); };",`window.watchlistPremiumControl = (symbol,container) => {
  const access=container.closest('.watchlist-grouped-actions')?.querySelector('.watchlist-access-controls') || container;
  attach(symbol,access,'ticker'); attach(symbol,access,'analysis');
 };`);
 maps.platform.set(p,s);
 p='src/modules/help/watchlist-guides.ts';s=read('platform',p);
 s=once(s,'Premium-only ticker hides a ticker','In Watchlist Admin, each ticker keeps its review actions visible. Expand More actions for Access, Move, Posting, Settings, Diagnostics and removal controls. Premium-only ticker hides a ticker');
 maps.platform.set(p,s);
 return maps;
}
module.exports={prepare,parents,runtime};
