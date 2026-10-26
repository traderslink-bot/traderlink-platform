"use strict";

// Separate Node bundle: Next must not evaluate the writer on its request thread.
// An explicit destination protects existing accepted Next build artifacts.
const { resolve } = require("node:path");
const { build } = require("esbuild");
const args = process.argv.slice(2);
if (args.length !== 2 || args[0] !== "--out-dir") throw new Error("erasure_worker_explicit_output_required");
build({
  absWorkingDir: resolve(__dirname, "../.."),
  entryPoints: ["src/modules/platform/server/privacy/platform-erasure-worker.ts"],
  outfile: resolve(args[1], "platform-erasure-worker.cjs"),
  bundle: true,
  platform: "node",
  target: "node24",
  format: "cjs",
  external: ["better-sqlite3"],
  // This bundled module has one import.meta.url use: deriving the protected
  // application root in platform-database-config. Preserve that boundary under
  // CJS using the runtime app cwd, not the generated bundle's /workers folder.
  define: { "import.meta.url": "__erasure_config_url" },
  banner: { js: 'const __erasure_config_url = require("node:url").pathToFileURL(require("node:path").join(process.cwd(), "src/modules/platform/server/database/platform-database-config.ts")).href;' },
  conditions: ["react-server"],
  logLevel: "warning",
}).catch(() => { process.exitCode = 1; });
