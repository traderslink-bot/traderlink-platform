'use strict';
const fs=require('node:fs'),path=require('node:path'),esbuild=require('esbuild');
const root=process.cwd(),args=process.argv.slice(2);
if(args.length!==2||args[0]!=='--out-dir'||!path.isAbsolute(args[1]))throw Error('Expected --out-dir ABSOLUTE_PATH');
const source=path.join(root,'scripts/platform/community-selected-delivery-command.cjs'),out=path.join(args[1],'community-selected-delivery.cjs');
fs.mkdirSync(path.dirname(out),{recursive:true});
const result=esbuild.buildSync({stdin:{contents:fs.readFileSync(source,'utf8'),resolveDir:path.dirname(source),sourcefile:path.basename(source)},absWorkingDir:root,bundle:true,platform:'node',target:'node24',format:'cjs',conditions:['react-server'],alias:{'server-only':require.resolve('next/dist/compiled/server-only/empty.js')},external:['better-sqlite3'],metafile:true,define:{'import.meta.url':'__platform_config_url'},banner:{js:'const __platform_config_url=require("node:url").pathToFileURL("/app/src/modules/platform/server/database/platform-database-config.ts").href;'},outfile:out});
fs.writeFileSync(path.join(args[1],'community-selected-delivery.inputs.json'),JSON.stringify(result.metafile.inputs,null,2)+'\n');
