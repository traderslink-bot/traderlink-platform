"use strict";

const { resolve } = require("node:path");
const { build } = require("esbuild");

build({
  absWorkingDir: resolve(__dirname, "../.."),
  entryPoints: ["src/modules/journal/server/demo/journal-demo-setup-worker.ts"],
  outfile: resolve(process.argv[2] ?? "workers/journal-demo-setup.cjs"),
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
}).catch(() => { process.exitCode = 1; });
