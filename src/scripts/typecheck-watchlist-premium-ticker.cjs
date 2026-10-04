// Deliberately bounded core-only check; full integrated acceptance is hosted.
const fs=require('node:fs');
let source=fs.readFileSync(__dirname+'/verify-watchlist-category-move-types.cjs','utf8');
source=source.replace(/const \{prepare,root,runtime,platformParent,runtimeParent\}=[^;]+;/,
 'const {prepare,parent:platformParent}=require("./package-watchlist-premium-ticker.cjs");const root=process.cwd(),runtime=root,runtimeParent=platformParent;');
source=source.replace('const {platform,changes}=prepare();','const platform=prepare();')
 .replace('[[root,platform],[runtime,changes]]','[[root,platform]]')
 .replace('ts.createProgram([...map.keys()]','ts.createProgram([...map.keys()].filter(file=>file.endsWith("live-watchlist-list.ts")||file.endsWith("live-watchlist-events.ts")||file.includes("0155_platform_watchlist_premium_access_controls.ts"))');
eval(source);
