# Watchlist price discovery implementation and verification

The owner approved implementation, QA and Coordinator production handoff on
October 28, 2026. The controlling
[plan](watchlist-price-discovery-boundary-plan.md) defines bounded historical
coverage, code-owned target messages and upper-only refresh suppression.
Implementation is in the assigned Runtime and Platform workspaces. Deployment
is pending Coordinator clean integration, build and hosted verification.

## Implemented behavior

The same pure coverage contract is present in both repositories. Code evaluates
the supplied daily, four-hour and intraday candles. Usable bounded history with
no observed higher resistance is distinct from missing, malformed or stale
history. A newly expanding high alone is not a demonstrated rejection.
Generation records the coverage decision without adding a model-output field
or a second request. Exhausted history uses empty numeric targets and this
code-rendered message:

> No higher resistance is identified in the supplied price history.

Missing history uses a separate unavailable message. Both analysis formats,
the actual inline preview and image export honor the same presentation.
Explicit owner hiding still applies; owner-added numeric targets remain
authoritative. Current market context has its own label and never rewrites the
saved original card, analysis date, price or historical screenshot.

The Runtime checks existing shared candles before request preparation. A
credible pause suppresses every automatic upper path, including breakout,
must-clear and the 15 percent extension fallback. Manual requests and lower
crossings remain independent. Real new structural evidence rearms its actual
price, not a null boundary. Its evidence identity is consumed and persisted
before paid preparation so the same event cannot automatically retry after
failure or restart. Existing cadence, session, request-budget and review
controls are unchanged.

The store and disk normalizers now share one implementation, retaining existing
automatic counters, dates and pending confirmations as well as coverage.
Activation and generation checks prevent an older read or late browser context
from becoming the current activation. Quote updates preserve original card
bodies and publication times. Restricted member projections remove the new
context. Newly typed approvals have a separate image-cache suffix; old frozen
approvals retain their original image identity and retry derivatives.

## QA findings corrected

- Removed a test dependency on a sibling checkout; Platform tests are standalone.
- Bound browser context reconciliation to the selected publication and analysis.
- Rejected contradictory optional coverage metadata without rejecting a read.
- Preserved the original pause time and historical range across unavailable
  data, so later genuine structure can still rearm.
- Missing completed intraday coverage cannot establish exhausted history even
  when usable daily candles exist; genuine supplied overhead is still retained.
- Added coverage decisions and all relevant coverage/input/prompt modules to
  the generation audit fingerprint.

## Verification

All verification uses synthetic, isolated inputs and mocked provider responses.
No real provider request, AI regeneration, notification, test post, restart,
settings update or historical rewrite occurred.

- Runtime coverage tests pass for upper suppression, independent lower/manual
  behavior, persistence/reload, pending publication, archive recovery, owner
  edits, consumed evidence and cache compatibility.
- Actual simple and detailed generation-service paths pass with a single
  mocked request per read, usable empty targets and the code-owned message.
- The actual manager test verifies that repeated callbacks establish and retain
  a pause using shared candles before candle preparation or the request budget.
  It also checks list moves and new-activation isolation.
- Platform focused regression set passes 31 tests, including actual SQLite
  preservation, editor save, member restrictions, browser-context reconciliation
  and existing Gain/Loss and historical-resistance behavior.
- Offline browser QA passes for actual simple and detailed card renderers on
  desktop/mobile in Light and Navy Dark. It checks current context versus frozen
  editor content, owner targets, hidden targets, missing history and restricted
  member presentation. All network requests are blocked; no app server is used.
- Final Runtime coverage/identity/image set: 23 passed, zero failed, including
  actual PNG rendering of the code message in both formats.
- Final Runtime and Platform full TypeScript checks both passed with
  `--noEmit --incremental false`.
- Final targeted Platform ESLint: zero errors, one pre-existing unused
  `cleanLevelMapCardBody` warning. Both `git diff --check` checks passed.
- Existing Runtime refresh/publication/access set: 32 passed and one unrelated
  listing-only test fixture failed; it omits a pre-existing manager Set used by
  approval lookup. The identical failure reproduces with the unchanged HEAD
  manager loaded in memory. Existing refresh decisions, publication guards and
  BRAI automatic-update context tests passed.
- Final browser recheck passed after the missing-intraday correction.
- The owner's additional final QA passed eight targeted Runtime policy,
  history, persistence and manager tests plus all five Platform context,
  editing, access and SQLite tests. Diff checks remained clean; no further
  source finding required a change.
- The two pure contract files are byte-identical, SHA256
  `31719415e06497d8538a1ee1121f5cd877da0d272db66c78cf411772f1e14ae3`.
- The unrelated dirty service worker remains unchanged, SHA256
  `b723716434862953454d6886db8cb158c884691f266b76899005fd6ea499ad4e`.

Six existing Runtime tests fail identically against unchanged HEAD sources:
retired invalidation warnings/preview/schema expectations, full-analysis text
in now-link-only Discord notifications, and old exact persistence defaults.
An in-memory Node loader substituted 11 original HEAD modules without modifying
files or Git. Baseline: 30 passed, the same six failed. These failures are not
fixed by changing unrelated accepted behavior.

The six legacy failures plus the separately confirmed listing-only fixture
failure remain disclosed, not reported as a fully green broad Runtime suite.
No feature-scope test failure remains.

## Reproducible commands

Runtime workspace:

```sh
node --import tsx --test --test-concurrency=1 src/tests/watchlist-upside-coverage.test.ts src/tests/traderslink-ai-read-code-identity.test.ts src/tests/watchlist-analysis-image.test.ts
node_modules/.bin/tsc --noEmit --incremental false
```

Platform workspace:

```sh
node --test src/lib/live-watchlist/__tests__/upside-coverage.node-test.cjs src/lib/live-watchlist/__tests__/analysis-inline-edit.node-test.cjs src/lib/live-watchlist/__tests__/historical-resistance.node-test.cjs src/lib/live-watchlist/__tests__/gain-card.node-test.cjs src/modules/watchlist/server/notifications/__tests__/watchlist-manual-loss.node-test.cjs
traderlink-browser-env node src/scripts/verify-watchlist-upside-coverage-view.cjs
node_modules/.bin/tsc --noEmit --incremental false
```

The browser script uses installed esbuild, Playwright and Chromium. It extracts
the unchanged actual analysis component and its lexical helpers from the page
module; unrelated page imports are excluded from this isolated browser bundle.
Generated screenshots are under ignored `artifacts/upside-coverage/` and are
not release source. No new preview, dependencies or copied checkout is needed.

## Release boundary

Coordinator alone owns Git, clean integration, builds, release ordering and
Railway actions. No database migration is required. Exclude pre-existing
`public/sw.js`, the separate recap plan and unrelated BRAI investigation
scripts. Preserve the prior approved resistance/Light-level, Gain/Loss,
divider and orange ticker changes while porting the narrow feature delta.

Production acceptance requires exact published source revisions, healthy
Platform and Runtime deployments on their original persistent volumes and
single-writer configuration, plus installed coverage-source verification.
Never regenerate an existing analysis or replay/resend notifications as a
rollout or acceptance step.

The [release handoff](watchlist-price-discovery-release-handoff.md) contains
the frozen source allowlist and hashes. Coordinator must port the delta onto
fresh verified release parents; these older assigned branches are not a
replacement for current production.
