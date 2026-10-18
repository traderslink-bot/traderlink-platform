// Focused compiler checkpoint; no app build, server, emitted files or network.
const ts = require("typescript");
const fs = require("node:fs");
const roots = [
  ...fs.readdirSync("src/types").filter(name => name.endsWith(".d.ts")).map(name => "src/types/" + name),
  ...fs.readdirSync("app/admin/journal/memberships").filter(name => name.startsWith("unified-plan-") && /\.tsx?$/.test(name)).map(name => "app/admin/journal/memberships/" + name),
  "src/scripts/verify-membership-plan-editor.ts",
  "app/admin/journal/memberships/page.tsx",
  "app/admin/journal/layout.tsx",
  "instrumentation.ts",
  "app/(dashboard)/account/preferences/page.tsx",
  "src/modules/platform/server/membership/platform-membership-stripe.ts",
  "src/modules/platform/server/membership/platform-membership-generation-allowance.ts",
  "src/modules/watchlist/server/private/private-watchlist-allowance.ts",
  "src/modules/platform/server/notifications/platform-remote-notification-delivery-service.ts",
  "src/modules/news/server/market-halt-web-push-repository.ts",
  "src/modules/news/server/press-release-web-push-repository.ts",
  "src/scripts/verify-membership-discord-editor.ts",
];
const config = ts.readConfigFile("tsconfig.json", ts.sys.readFile);
if (config.error) throw Error(ts.flattenDiagnosticMessageText(config.error.messageText, " "));
const parsed = ts.parseJsonConfigFileContent(config.config, ts.sys, ".");
const program = ts.createProgram(roots, { ...parsed.options, noEmit: true, incremental: false, types: ["node", "react"], skipLibCheck: true });
const diagnostics = [...parsed.errors, ...ts.getPreEmitDiagnostics(program)];
for (const diagnostic of diagnostics) {
  const location = diagnostic.file && diagnostic.start !== undefined
    ? diagnostic.file.fileName + ":" + (diagnostic.file.getLineAndCharacterOfPosition(diagnostic.start).line + 1) : "configuration";
  console.log(location + " " + ts.flattenDiagnosticMessageText(diagnostic.messageText, " "));
}
console.log(JSON.stringify({ roots: roots.length, diagnostics: diagnostics.length }));
process.exitCode = diagnostics.length ? 1 : 0;
