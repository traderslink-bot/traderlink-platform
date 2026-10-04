const fs=require('node:fs');
let source=fs.readFileSync(__dirname+'/verify-watchlist-category-move-types.cjs','utf8');
source=source.replace(/const \{prepare,root,runtime,platformParent,runtimeParent\}=[^;]+;/,
 'const {prepare,parent:platformParent}=require("./package-watchlist-premium-analysis.cjs");const root=process.cwd(),runtime=root,runtimeParent=platformParent;');
source=source.replace('const {platform,changes}=prepare();','const platform=prepare();')
 .replace('[[root,platform],[runtime,changes]]','[[root,platform]]')
 .replaceAll("file.endsWith('.ts')",'/\\.tsx?$/.test(file)');
if(process.argv.includes('--core')) source=source.replace('ts.createProgram([...map.keys()]',
 'ts.createProgram([...map.keys()].filter(file=>file.endsWith("premium-analysis-preview.ts")||file.includes("0155_platform_watchlist_premium_analysis_access.ts"))');
eval(source);
