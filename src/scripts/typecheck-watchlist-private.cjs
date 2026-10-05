// Bounded category contracts only. Integrated build remains the hosted gate.
const fs=require('node:fs');
let source=fs.readFileSync(__dirname+'/verify-watchlist-category-move-types.cjs','utf8');
source=source.replace(/const \{prepare,root,runtime,platformParent,runtimeParent\}=[^;]+;/,'const {prepare,runtime,parents}=require("./package-watchlist-private.cjs");const root=process.cwd(),platformParent=parents.platform,runtimeParent=parents.runtime;');
source=source.replace('const {platform,changes}=prepare();','const prepared=prepare(),platform=prepared.platform,changes=prepared.runtime;');
source=source.replace('ts.createProgram([...map.keys()]','ts.createProgram([...map.keys()].filter(file=>file.endsWith("live-watchlist-types.ts")||file.endsWith("watchlist-entry-session.ts")||file.endsWith("live-watchlist-session-group.ts"))');
eval(source);
