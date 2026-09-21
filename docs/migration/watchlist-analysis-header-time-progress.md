# Watchlist analysis header time

## Corrective production acceptance September 21

- Runtime 9d75f897 / deployment cbb78b97 and Platform ae46df66 / deployment
  ff360bac are reported healthy by Coordinator. Read-only live acceptance confirms
  GRML Sep 18 7:52 PM $4.35 and Sep 21 4:12 AM $5.32; GLND Sep 18 7:56 PM
  and Sep 21 4:18 AM. No seconds appear in the history rows.
- GLND mobile header fits within its 273px content width at the requested 390px
  viewport; no horizontal header overflow. Temporary viewport restored.
- Potential Gain baselines remain GRML $4.35 and GLND stored $2.6001; unchanged.
- One display-only followup restores existing price precision: two decimals at
  $1 or above, four below $1. Thus GLND displays $2.60 / $2.87, while stored
  $2.6001 / $2.8693 remain lossless. Added focused regression assertions.
- Live list contains no Simple-format analysis, so no live Simple acceptance is
  claimed; it uses the same tested history component. No test ticker was added.

## Live acceptance correction

- First deployment 57b5609 corrected the current time, but history returned no rows:
  the private runtime review GET requires an owner actor. A member history reader
  correctly cannot impersonate the owner. Initial mocked verification missed this.
- Corrective runtime patch introduces a separate service-token-protected, GET-only
  published-history projection, while retaining the private review owner requirement.
  It exposes only acknowledged time/price rows through a requested public-card hash.
- Platform consumes that sanitized endpoint. No owner identity/header is fabricated.
- Actual deployed runtime dispatcher plus corrective patch is now exercised in the
  focused verifier, including ownerless projection, private review 403, POST 405,
  malformed hash 400, member authorization and shared caching. These checks pass.
- Runtime patch: [published history projection](watchlist-analysis-history-runtime.patch).
  Apply to runtime 8c8068dba6d2fe5d4f7ce5cb51379ca5686cc8b3, then Platform correction.
  No database migration, regeneration, approval, notification or data edits required.
- Full live multirow/mobile acceptance is still pending the corrective deployment.

## September 21 owner-approved publication history (current scope)

- Supersedes the one-line timestamp correction and its old patch artifact.
- Both full and Simple analysis cards show chronological rows under the title:
  `Analysis posted: Sep 18, 7:52 PM ET — $4.35`, followed by one
  `Analysis updated: Sep 21, 4:12 AM ET — $5.32` row per published analysis.
- Short month/day; Eastern time; no year or seconds. Existing eyebrow typography.
- Read the existing runtime approval audit server-side, select only website-acknowledged
  approvals up to the exact currently displayed card, and expose only time/price pairs.
  No private events, actor identities, drafts, prompts, credentials or delivery data
  are sent to members. Existing Watchlist access rules protect the new read route.
- Deduplicate repeated delivery of the same generation and reference price.
- Cache only public rows for 60 seconds (100-key bound), coalesce concurrent reads;
  request once per displayed generation, not on live price updates. No AI calls.
- If history cannot be read/matched, show the current analysis time/price as
  `Analysis:` rather than inventing an original or confusing a draft with publication.
  Editor previews say `Analysis preview:` and do not request publication history.
- Potential Gain, original Watchlist time, analysis content, approval and all delivery
  behavior are untouched. No migration or runtime deployment required.
- Help updated for the owner-approved history lines. Focused verifier:
  `src/scripts/verify-watchlist-analysis-history.cjs`.
- Release packaging must include only this slice's hunks from the mixed e70f tree.
  The old `watchlist-analysis-header-time.patch` is superseded; do not release it.
- Implementation and focused local QA complete: history/format fixtures, third update,
  failed/unacknowledged exclusion, generation boundary, duplicate delivery, DST,
  sub-dollar precision, authorization, read-only upstream access, sanitized response,
  concurrent-request coalescing, and five-file TS/TSX transpilation pass.
- Targeted ESLint passes with no errors; one pre-existing unused-function warning in
  live-watchlist-client.tsx. No local server, full build, broad suite, AI request,
  hosted write or notification send. Production rendering remains a release check.

## September 21 refreshed-analysis correction (supersedes first-post header rule)

- Owner approved using the displayed analysis's generatedAt for its header time.
- Replace only the firstPostedAt fallback in the full card header; retain session,
  reference price, typography, section order and the Simple card unchanged.
- Original Watchlist posting metadata and Potential Gain starting price/time remain
  unchanged. No regeneration, publication, notification or provider request needed.
- GRML regression evidence: original Sep 18 19:52:36 ET / $4.35; refreshed
  Sep 21 04:12:46 ET / $5.32. Header must use 04:12:46, not 19:52:36.
- Help reviewed: existing guidance says to read the analysis timestamp and reference
  price; this fix restores that contract, so no Help copy change is necessary.
- Implementation complete; focused verification and Coordinator packaging below.
- Production deployment remains pending; do not publish the mixed e70f file wholesale.

## September 15 owner correction

Controlling scope: [Watchlist runtime dashboard admin plan](watchlist-runtime-dashboard-admin-plan.md).

- Full analysis header order: TradersLink Analysis, ticker trade preparation,
  session + saved first-post time in ET + analysis price, then bias.
- Preserve existing typography and section controls. A draft without a public
  first-post timestamp uses its saved generation time; no invented posting time.
- No change to the Simple card, AI payload, approval, Discord images or delivery.
- Existing Help already explains the posted analysis price and distinguishes
  candle data timestamps from page-load time; no guide change is needed for
  this ordering correction.

## Indicator diagnosis (read-only; not fixed in this slice)

Production VEEA refresh audits show the 5m selection alternating between current
Yahoo history and Moomoo history ending at 7:20 AM ET. The latter is accepted as
sufficient history and replaces newer results. This is not the addition time.
The stored first public-post timestamp for this activation is 9:00 AM ET.
Future correction must prevent provider switching from regressing dataThrough,
while retaining original timestamps when neither provider has fresh data.

## Verification / release

- Targeted TSX transpilation and header-order/timezone assertions passed.
- No AI/provider requests, database mutations, Discord sends, server, broad test
  suite or build were performed for this correction.
- Local immutable header-only commit based on production 16bc8de; unrelated
  worktree changes excluded. Rendered acceptance and production release pending.
