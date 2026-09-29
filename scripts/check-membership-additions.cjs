// Targeted static checks only: no server, test suite, database or emitted files.
const ts = require("typescript");
const roots = [
  "app/(dashboard)/levels/stock-levels-client.tsx",
  "app/(dashboard)/trade-tracker/manual-trade-post-entry-review.tsx",
  "app/(dashboard)/workspace/workspace-trade-analyzer-panel.tsx",
  "app/(dashboard)/workspace/workspace-trade-library-client.tsx",
  "app/admin/journal/memberships/management-panels.tsx",
  "app/admin/journal/memberships/plans/new/page.tsx",
  "app/api/live-watchlist/route.ts",
  "app/api/live-watchlist/symbols/[symbol]/analysis-history/route.ts",
  "app/api/live-watchlist/symbols/[symbol]/indicators/route.ts",
  "app/api/live-watchlist/symbols/[symbol]/route.ts",
  "app/plans/page.tsx",
  "app/plans/plan-catalog.tsx",
  "app/watchlist/[symbol]/page.tsx",
  "app/watchlist/archive/[archiveId]/page.tsx",
  "app/watchlist/archive/page.tsx",
  "app/watchlist/live-watchlist-client.tsx",
  "src/lib/live-watchlist/live-watchlist-events.ts",
  "src/lib/live-watchlist/live-watchlist-types.ts",
  "src/modules/help/paid-plan-guides.ts",
  "src/modules/help/stock-levels-guides.ts",
  "src/modules/help/trade-analyzer-guides.ts",
  "src/modules/help/watchlist-guides.ts",
  "src/modules/level-analysis/contracts/shared-analyzer-beta-contracts.ts",
  "src/modules/level-analysis/server/shared-analyzer-allowance-repository.ts",
  "src/modules/platform/contracts/platform-membership-contracts.ts",
  "src/modules/platform/server/database/platform-migration-manifest.ts",
  "src/modules/platform/server/membership/platform-membership-catalog-repository.ts",
  "src/modules/platform/server/membership/platform-membership-features.ts",
  "src/modules/platform/server/membership/platform-membership-management.ts",
  "src/modules/platform/server/membership/platform-membership-repository.ts",
  "src/modules/stock-levels/server/stock-levels-service.ts",
  "src/modules/stock-levels/stock-levels-contract.ts",
  "app/(dashboard)/trade-analyzer-allowance-summary.tsx",
  "app/admin/journal/memberships/generation-reset-field.tsx",
  "app/watchlist/watchlist-feature-message.tsx",
  "src/lib/live-watchlist/watchlist-member-projection.ts",
  "src/modules/platform/server/database/migrations/0150_platform_membership_generation_allowances.ts",
  "src/modules/platform/server/membership/platform-membership-generation-allowance.ts",
  "src/modules/watchlist/server/access/watchlist-feature-access.ts"
];
const config = ts.readConfigFile("tsconfig.json", ts.sys.readFile);
if (config.error) throw new Error(ts.flattenDiagnosticMessageText(config.error.messageText, " "));
const parsed = ts.parseJsonConfigFileContent(config.config, ts.sys, ".");
const program = ts.createProgram(roots, { ...parsed.options, incremental: false, noEmit: true, types: ["node", "react"] });
const diagnostics = [...parsed.errors, ...ts.getPreEmitDiagnostics(program)];
for (const item of diagnostics) {
  const location = item.file && item.start !== undefined ? `${item.file.fileName}:${item.file.getLineAndCharacterOfPosition(item.start).line + 1}` : "configuration";
  console.log(location, ts.flattenDiagnosticMessageText(item.messageText, " "));
}
console.log(JSON.stringify({ roots: roots.length, diagnostics: diagnostics.length }));
process.exitCode = diagnostics.length ? 1 : 0;
