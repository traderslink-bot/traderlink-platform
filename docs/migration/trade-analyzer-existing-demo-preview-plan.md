# Trade Analyzer Analysis — existing Demo pages

Status: all32 actual Demo screenshots imported and locally verified; no deployment performed.

## Approved static-screenshot successor — 2026-10-15

Owner chose desktop/mobile screenshots of every existing Demo Analysis page,
in Light and Navy Dark. Filters, pagination, replay and all other image controls
are inactive. Only the upgrade link works. This supersedes the live Demo-scope
routing and filter/replay integration proposal below; retain it as source audit
history, not current implementation scope. The existing Demo is on
app.traderslink.pro under a specific owner-selected account. PC Codex will
capture from that authenticated browser. No credentials, storage state or
database need to be transferred.

See [PC capture handoff](trade-analysis-screenshot-capture-handoff.md). Renderer
uses local precompressed WebP with responsive picture sources and shared theme;
no runtime image optimization or Demo-data queries. The actual32 captures have arrived and the manifest now references their
compressed WebP versions. The invented example table has been removed.
Local responsive browser checks pass; live signed-member app review remains.
Owner direction, 2026-10-15: use the existing Demo account and its suitable saved
results exactly. Use the actual Analysis pages. No invented replacement dataset,
miniature example table or redesigned substitute. Say Demo data. Pagination is
not required for the restricted demo and is excluded from this work.

## Source findings

- All eight Analysis views share `app/(dashboard)/analytics/trade-analysis-page.tsx`.
  Keeping this renderer preserves the actual layouts, comparisons, tables and
  charts rather than maintaining a second demo implementation.
- `JournalDemoAccountRepository` identifies Demo accounts by user/workspace and
  distinguishes the selected account from an available Demo account. Demo
  lifecycle can record deliberate clearing; preview reads must not recreate a
  cleared Demo or change the member's selected real account.
- `withSavedPatternRuntime` and the reporting runtime already read saved results
  using a scoped account. The existing Demo analyzer/indicator materializers
  support those saved analysis results. This audit does not question their
  suitability or audit/copy the owner's data.
- Client filtering, candle occurrences and chart replay call separate APIs.
  The detail drawer uses the shared single-trade replay endpoint. Those reads
  must retain Demo context independently of the member's active-account cookie.
- Relative date presets currently use the wall clock. Preserve the existing Demo
  experience and date anchor so its existing results are displayed as intended.
- The previous three-row placeholder is rejected and must be replaced. Its
  screenshot is not the proposed final Demo experience.

## Implementation approach

1. Resolve member access into two server-owned contexts: entitled member data,
   or read-only existing Demo data. Keep the authenticated viewer separate from
   the Demo data source; never impersonate the Demo owner or accept arbitrary
   account IDs from the browser.
2. Reuse the same Analysis renderer and existing Demo saved results. Add only
   a compact Demo data label and upgrade action. Preserve the real UI, shared
   themes and existing result calculations. Do not generate new analyses.
3. Bind the required filtering and replay reads to that same Demo source. A
   client parameter alone must never grant personal-data access. Do not alter
   the shared Journal permission to replay the member's permitted Journal trade.
4. Leave pagination out of this preview scope, per the owner. Existing entitled
   pages retain their current pagination behavior.
5. Keep Demo interactions read-only: no imports, trade edits, generation,
   provider calls or usage charges. Keep Demo cache/offline identity separate
   from personal accounts and entitled saved views.
6. Verify actual Demo pages against their ordinary Demo-account rendering:
   matching data, charts, comparisons, filters and replay where enabled; check
   desktop/mobile, both themes and direct API attempts to request personal data.
   Present the actual running app for review, not another simplified screenshot.

## Boundary to resolve during implementation

The existing Demo is per member/workspace and may have been cleared. Define a
server-validated reference to the existing canonical Demo source for restricted
viewers who do not have a local Demo account; preserve deliberate clearing and
never broaden normal WorkspaceAccessScope to another member. This is a source
routing/isolation decision, not a missing-results or new-data requirement.
No production database inspection, copying, migration or hosted mutation is
performed or authorized by this plan.

Next: implement Demo-source resolution and reuse the existing page renderer,
then connect the required read-only filter/replay calls. Keep the current access
checks in place until this isolated Demo path is verified.
