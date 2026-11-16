"use strict";

const { execFileSync } = require("node:child_process");
const { dirname, join, resolve } = require("node:path");
const { build } = require("esbuild");

const outfile = resolve(process.argv[2] ?? "workers/journal-demo-setup.cjs");

build({
  absWorkingDir: resolve(__dirname, "../.."),
  entryPoints: ["src/modules/journal/server/demo/journal-demo-setup-worker.ts"],
  outfile,
  bundle: true,
  platform: "node",
  target: "node24",
  format: "cjs",
  external: ["better-sqlite3"],
  conditions: ["react-server"],
  plugins: [{
    name: "server-only-marker",
    setup(builder) {
      builder.onResolve({ filter: /^server-only$/ }, () => ({
        path: "server-only", namespace: "server-only-marker",
      }));
      builder.onLoad({ filter: /.*/, namespace: "server-only-marker" }, () => ({ contents: "" }));
    },
  }],
  define: { "import.meta.url": "__database_config_url" },
  banner: {
    js: 'const __database_config_url = require("node:url").pathToFileURL(require("node:path").join(process.cwd(), "src/modules/platform/server/database/platform-database-config.ts")).href;',
  },
}).then(() => {
  execFileSync(process.execPath, [outfile, "--prepare-schema", join(dirname(outfile), "journal-demo-schema.sqlite")], {
    env: { ...process.env, NODE_PATH: resolve(__dirname, "../../node_modules") },
    stdio: "inherit",
  });
}).catch(error => {
  console.error(error);
  process.exitCode = 1;
});
