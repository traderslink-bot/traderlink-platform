'use strict';
const fs=require('node:fs'),path=require('node:path'),esbuild=require('esbuild');
const root=process.cwd(),source=path.join(root,'scripts/platform/news-general-0185-maintenance-command-20261028.cjs'),out=path.join(root,'news-maintenance/news-general-0185-maintenance.cjs');
fs.mkdirSync(path.dirname(out),{recursive:true});
esbuild.buildSync({stdin:{contents:fs.readFileSync(source,'utf8'),resolveDir:path.join(root,'scripts/platform'),sourcefile:'news-general-0185-maintenance-command-20261028.cjs'},absWorkingDir:root,bundle:true,platform:'node',format:'cjs',conditions:['react-server'],external:['better-sqlite3'],define:{'import.meta.url':'__platform_config_url'},banner:{js:'const __platform_config_url=require("node:url").pathToFileURL("/app/src/modules/platform/server/database/platform-database-config.ts").href;'},outfile:out});
