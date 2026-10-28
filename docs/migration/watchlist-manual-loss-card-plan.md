# Manual loss card for Watchlist Admin

## Owner scope and current status

Add a separate owner-entered loss card for any eligible ticker in Watchlist
Admin. Keep Potential Gain calculations and controls unchanged. This card is for explicit image posting,
not the public ticker detail page or the Journal. Implementation is authorized;
production deployment and real Discord sends are not.

Coordinator subsequently confirmed the existing Platform and Runtime lanes and
the exact feature scope. Implementation and focused checks are complete; no
Git mutation, service startup, deployment or real delivery is authorized here.
Do not stop or replace the current Coaching preview. The earlier failed contact
was not treated as a receipt.

Owner clarified that Loss should directly match the actual Potential Gain
layout, in red, with **Entry price** and **Exit price** replacing Starting price
and Highest after added. Omit High observed. Owner also explicitly requested
removal of the entire existing Gain footer starting “Measured from” and ending
“Based on observed live prices after tracking began.” Remove that shared
rendered paragraph only, keeping saved times/prices and calculations intact.

## Admin design

Place **Post Loss** immediately beside **Post Gain** in More actions → Posting.
Follow the same Private-list visibility rules as Post Gain. The action works
independently of whether analysis or a gain card exists for that ticker.

The dialog title is **SYMBOL — Post Loss**. It opens with empty fields:

1. **Entry price ($)** and **Exit price ($)**, side by side on desktop and stacked
   on narrow mobile screens. Preserve entered decimal precision.
2. **Notes (optional)**, included within the image with preserved line breaks.
3. A calculated **Loss** reading once both prices are valid.
4. **Preview image**, which freezes the entered values and shows the actual PNG.
5. **Message (optional)** outside the image, matching the existing Gain post.
6. **Back to edit**, **Send to Discord**, and **Close** as appropriate to the
   editing/preview/sent states. Entering or previewing never sends anything.

The image reuses the actual Gain card's CSS classes and light-image treatment,
with the local positive accent mapped to the existing negative theme token.
It contains ticker and TradersLink branding, **Trade Loss**, a large signed
percentage such as **−12.50%**, **Entry price**, **Exit price**, and optional
notes. No empty Notes section, timestamps, automatic
quote, observed high, holding period, share quantity, dollar P&L or fees are
invented. The surrounding admin dialog supports both Light and Navy Dark.

The card must not imply this is a measured Watchlist opportunity. It reports
the owner's entered buy-to-sell price change; no position sizing or charges
are available for a net realized-P&L calculation.

## Calculations and manual inputs

Use the shared decimal arithmetic library on client and server:

`percentage change = (sell price − buy price) ÷ buy price × 100`.

Buy price must be positive; sell price may be zero, supporting a 100% loss.
Reject blank, non-decimal, nonfinite and negative values. A sell above buy is not
a loss and gets a field-level explanation. Equal prices produce 0%, not a green
gain or negative zero. Display percentage to two decimal places while preserving
the entered prices; do not round before calculating. A tiny nonzero loss that
rounds to zero should read **less than 0.01% loss**, rather than implying no loss.

No field is populated from publication, activation, gain tracking, quotes,
candles, previous card content or the current clock. Closing/reopening starts a
fresh manual card, as Gain starts a fresh post. Do not silently save a draft in
public Watchlist state or browser storage. The send receipt remains durable.

Bound notes and optional post text for image/message size, with visible counters
or helper text. Plain text is rendered as text, never HTML. Long words and line
breaks must wrap without cropping the captured image.

## Existing workflow to reuse

Platform source starts at `1a84659f64344abf0745bd7c356de80d8c6b1681` in
`/home/traderlink/projects/watchlist-gain-card`. Runtime source starts at
`541ad7237d977a5724dc3fc27b58e3b02a568390` in
`/home/traderlink/projects/watchlist-gain-runtime`. Recheck before coding.

Runtime `src/runtime/manual-watchlist-row-review.ts` currently emits a
same-origin `post-potential-gain` message to the authenticated Platform wrapper.
Add a separate `post-manual-loss` action, retaining the wrapper's exact origin,
iframe source, source label and ticker validation. Do not modify Gain's action.

Platform `watchlist-potential-gain-post.tsx` currently loads the published Gain
card and captures it through `capturePotentialGainCard`. Loss must use a
separate manual editor and card, and reuse capture without calling Gain's GET
or any market-data endpoint. Show the exact image that will be sent. Prevent
stale capture completion after edit/close/ticker change and release object URLs.

Existing delivery uses the server-only
`WATCHLIST_POTENTIAL_GAIN_DISCORD_WEBHOOK_URL`, verifies the existing channel,
and appends **@everyone** with only everyone mention parsing enabled. Loss uses
that same destination and mention behavior. No new webhook/channel/variable,
email, push, automatic trigger or category routing is introduced.

Prefer a small shared image-delivery implementation with Gain as the unchanged
default and Loss as an explicit variant. Loss filenames/descriptions must say
loss, not potential gain. Reuse the current durable image-post receipt table;
include card kind and manual payload in the Loss hash so an ID cannot be reused
for different content or a Gain request. No migration is expected. Verify this
against actual implementation before claiming it final.

A separate owner-only loss POST route retains existing admin authorization,
same-origin mutation checks, bounded actual request bytes, PNG dimensions/size
and symbol/request identity validation. Recalculate from the submitted manual
prices on the server; never accept a caller-supplied percentage as authoritative.
No public read endpoint or ticker-detail renderer imports the loss component.

Double clicks and retry-after behavior follow existing durable Gain receipts.
Freeze the exact image/text/manual inputs per send identity. Discord 429 permits
explicit retry after its wait; timeout/5xx remains uncertain and advises checking
Discord, with no automatic blind resend. No extra analysis approval rule or
gate is added to any existing publication workflow.

## QA before release handoff

- Verify examples: 2.00 → 1.50 gives −25%; 0.125 → 0.10 gives −20%;
  1.00 → 0 gives −100%; equal prices give 0%; precision and tiny losses display
  honestly. Reject blank, malformed, negative and nonfinite inputs, sell above
  buy and excessive content without losing the entered form.
- Exercise preview, edit, regenerate preview, close, ticker switch, capture
  failure and repeated clicks. Ensure only the newest exact PNG is sendable.
- Test real DOM capture in an isolated browser, desktop/mobile widths and
  Light/Navy Dark dialog states. Inspect the red PNG, notes wrapping and branding.
  No app/provider credentials, production data or live deliveries are needed.
- Mock Discord success, wrong destination, unconfigured webhook, 429, timeout,
  5xx and duplicate requests; assert destination, @everyone, attachment naming,
  immutable input binding and no blind resend. Use in-memory receipts only.
- Verify unauthorized/cross-origin requests never reach delivery, payload bounds
  and server recalculation. Test same ID across Gain/Loss is not silently reused.
- Re-run existing Gain delivery, calculation and Runtime button/message tests.
  Confirm no gain tracking mutation, quote/AI request, listing/approval change,
  public card, email/push or automatic Loss delivery is introduced.
- Update the existing Watchlist owner Help alongside the feature. Record focused
  tests/lint/type checks and applicable checkpoint build results separately from
  owner visual acceptance. Coordinate heavy operations and previews first.

## Expected change boundary

Platform: admin wrapper; new manual Loss editor/card and pure calculator; new
owner-only loss POST route; narrowly shared existing Gain delivery helper;
focused tests and offline component/capture runner; Watchlist Help; this
plan/progress record; shared public Gain renderer only for the owner-requested
footer removal. Runtime: only the
row-review Post Loss action and focused action tests. Confirm shared-file
ownership before these edits. No other public Watchlist source, database schema,
global theme, navigation, settings, worker, provider or AI prompt changes.

Existing `public/sw.js`, the standalone recap plan and both BRAI evidence probe
scripts remain outside this feature and must be preserved. Coordinator owns
commits and release mechanics. Owner/PC retains product and visual acceptance.

## Implementation checkpoint

- Separate Post Loss Runtime action and wrapper message are implemented. It
  passes only the ticker, never prices or times, and follows Gain's Private-list
  visibility. No activation or publication action changes.
- Manual Loss uses decimal arithmetic, rejects a zero entry even for a zero
  exit, supports zero exit/100% loss, and distinguishes a tiny loss from flat.
- The separate authenticated POST bounds actual streamed bytes and validates
  inputs before opening delivery storage. Server recomputes the percentage.
- Loss shares the existing verified destination, everyone mention and receipt
  table. Gain hashes remain byte-compatible. Loss binds kind, prices, notes,
  message and PNG, preventing same-ID cross-kind/content reuse.
- Existing Gain dialog and tracker are untouched. The shared Gain renderer has
  only the complete footer paragraph removed, so its posting PNG follows suit.
- Focused checks pass: 29 Platform tests (ten Loss/Gain calculator, route,
  delivery and render checks plus 19 existing notification/move regressions),
  two Runtime button tests and targeted lint. Isolated browser capture
  passed desktop/mobile and dark dialog, blank fields/no GET, exact PNG send to
  mock, edit/recapture, 429 same-ID retry and uncertain no-resend. All HTTP was
  intercepted; no app service or provider request was made.
- The initial isolated browser harness lacked Next Image defaults; correcting
  the harness made the actual component check pass. This was not a production
  change. Final Entry/Exit-label and price-format browser rerun also passed.
- Whole-Platform typecheck exhausted Node's default 2 GiB heap before producing
  diagnostics. The sequential 4 GiB retry passed the full Platform typecheck:
  `NODE_OPTIONS=--max-old-space-size=4096 node_modules/.bin/tsc --noEmit --incremental false`.
  A local full Next build
  would overwrite the preexisting dirty service worker via Serwist, so it must
  not be run casually in this lane. Immutable integration-build verification is
  a separate pending checkpoint, not a claimed pass.

Synthetic screenshots under `artifacts/watchlist-manual-loss` are temporary
owner-review outputs, not saved trades or production evidence. Keep only useful
final previews during review; cleanup follows the applicable approval policy.

## Handoff and remaining acceptance

No application service, live provider, real Discord send, notification,
production data change or deployment was used. The intentional mocked 502 in
the browser test verifies the uncertain-delivery state; it is not a live outage.
Whole-Platform typecheck and targeted checks passed; immutable full Next build,
integrated hosted acceptance and owner visual review remain unclaimed. The
existing Coaching preview and dirty service worker are untouched.

Exact Platform feature allowlist:

- `app/(dashboard)/admin/watchlist/watchlist-runtime-admin-client.tsx`
- `app/(dashboard)/admin/watchlist/watchlist-manual-loss-card.tsx`
- `app/(dashboard)/admin/watchlist/watchlist-manual-loss-post.tsx`
- `app/api/admin/watchlist/manual-loss-post/route.ts`
- `app/watchlist/live-watchlist-client.tsx` (entire Gain footer only)
- `src/lib/live-watchlist/manual-loss-card.ts`
- `src/modules/watchlist/server/notifications/watchlist-potential-gain-post.ts`
- `src/modules/watchlist/server/notifications/__tests__/watchlist-manual-loss.node-test.cjs`
- `src/scripts/verify-watchlist-manual-loss-preview.cjs`
- `src/modules/help/watchlist-guides.ts`
- `docs/migration/watchlist-manual-loss-card-plan.md`
- `docs/migration/watchlist-potential-gain-discord-plan.md` (plan link only)

Exact Runtime feature allowlist:

- `src/runtime/manual-watchlist-row-review.ts`
- `src/tests/watchlist-gain-card-label.test.ts`

The React review kept the established MUI/theme contract, deferred the dialog
bundle, retained origin and iframe-source checks, used event-driven previewing
without market-data effects, cleaned up asynchronous capture/object URLs, and
verified mobile/dark controls. The fixed light image deliberately matches Gain;
only its local accent changes to the existing red theme token. Help now explains
the manual Loss workflow separately from Gain.
