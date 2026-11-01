# Watchlist resistance evidence correction

Owner approved implementation and production release on October 28, 2026.
Stop fabricated numeric resistance in the Levels System and Watchlist fallback;
preserve genuine historical/session levels, support, AI analysis, owner edits,
publication facts and the completed Loss feature. No analysis regeneration,
provider test requests, Discord test posts, resend or historical rewrite.

## Recorded evidence and ownership

The responsible source is the VPS-managed Runtime checkout
`/home/traderlink/projects/watchlist-gain-runtime`, deployed on Railway, not an
active PC-only service. Platform's current display/read source is in
`/home/traderlink/projects/watchlist-gain-card`. Coordinator owns Git and release.

The bounded, read-only Platform projection on deployment
`c2766cba-a630-46de-a746-af5a246c1c83`, source
`e8b35cda7b8fd9eb39c01c8670ecade312fb6478`, at 15:16:26 UTC recorded AIOK:

- Current structured map: 17.29 intraday with four touches/two source evidence;
  18.50 premarket high with two touches/two source evidence; 21 and 22 labelled
  weak extension, zero touches/zero source evidence/no market-data provenance.
- Saved Potential Path text also included 23 as a weak extension. The current
  saved projection did not contain 20; its former origin is not reconstructed.
- Current simple analysis was generated at 10:33:57 AM ET using a 10:30 AM ET
  reference of 18.535, with upside 18.99 and 19.30, breakout 19.30 and an explicit
  statement that no higher resistance was identified in the supplied history.
  These were not the 21/22/23 extension rows in the resistance map.
- Data-quality status was full by timeframe presence, but flags included
  insufficient daily/4h/5m history, gaps and incomplete session coverage.
  This is not proof of all-time coverage or the owner's reported all-time high.

An additional bounded Runtime diagnostic read stalled at Railway SSH before
returning JSON; Coordinator stopped only its own local SSH processes. Saved
request history ranges and adjustment basis remain unavailable, not inferred
from current data or regenerated. This does not block correcting the proven
zero-evidence extension path.

## Source changes

The Levels System extension selector retains observed candidates but no longer
calls its synthetic-coverage builder, even for an older caller supplying its
deprecated enable flag. The ranker no longer requests synthetic generation.
The Runtime snapshot no longer invokes the continuation-map filler and filters
known synthetic cached resistance zones before display selection.

The pure evidence classifier recognizes explicit generator IDs/notes, the
continuation-map source and the exact older extension signature of explicit
zero touches and zero source evidence without observed provenance. Merely
missing metadata or being weak, rounded, or an extension is not sufficient to
remove a structured level. Genuine historical extensions retain their evidence.

Publisher projections filter cached synthetic zones too. New Full Ladder text
cards retain a bounded, structured resistance-evidence inventory in metadata,
including real outer levels not selected for the compact Potential Path.

Platform applies a pure projection only on current `getSymbol`/`listSymbols`
returns. It does not update the database, archives or analysis. It reconciles
nearest resistance, level-derived trade-plan references and affected card text.
The saved raw row and AI targets/notes/publication/gain facts remain unchanged.

Old source-generated text cards lost per-row counts. Explicit continuation-map
lines and known synthetic prices are withdrawn from their resistance sections.
The older weak-extension text signature requires a retained structured record
or Full Ladder evidence before being displayed as resistance; corroborated real
extensions survive. Ambiguous structured rows with absent counts are preserved.
This is a current-view correction, not a deletion of original evidence.

When appropriate the card says **No higher historical resistance detected in
the available price history.** Unavailable history has separate copy. Neither
message claims complete all-time history. No price is added to reach a
percentage coverage target. AI prompts and targets are untouched.

## Separately approved ticker divider

Runtime `li.watchlist-control-row` and its first-child variant receive one
2 px solid `#64748B` top border. It replaces the faint row boundary, including
the first ticker in each section. No new bottom border, padding, gaps, cards,
button movement or global list rule is introduced. The actual ticker iframe
has a white background, so the dark outer dashboard does not change this colour;
no unrelated dark-mode conversion is included.

## Verification checkpoint

- Runtime engine, publisher and evidence suites: 104 tests passed after updating
  the old invented-coverage expectations to assert actual observed levels.
- Three focused manager regressions passed: real deeper levels preserved,
  wide gaps not filled, one real overhead level not expanded into rounded prices.
- Three Runtime button/divider tests passed, including unchanged Gain/Loss
  actions and the explicit first-row top-border override.
- Platform evidence/read tests: five passed, including in-memory SQLite reads
  proving the stored JSON remains byte-for-byte unchanged.
- Platform gain/loss regressions plus evidence suite: 20 tests passed.
- A manager test's retired Trader Read toggle/last-patch assumption and missing
  historical PC article command were replaced with a pure presentation assertion
  and mock lookup. No provider request was made; production review controls were
  not changed to make a test pass.
- Full Platform TypeScript check passed with a 4 GiB heap and no incremental
  output; full Runtime TypeScript check passed separately.
- Offline Playwright rendered the actual outer Potential Path component and
  Full Ladder with the real shared CSS/Preflight on desktop and mobile/dark.
  Observed 17.29/18.50 and support survived; cached 21/22/23 did not appear.
  The bounded-history notice and unavailable-data copy were verified separately.
  The exact Runtime styles gave both first and later ticker rows one 2 px slate
  top border, no bottom border, unchanged padding and no unrelated-list change.
- Harness-only corrections supplied the normal Next process shim, Tailwind
  Preflight and actual outer card wrapper; no product CSS was changed to make
  the isolated test pass. All requests were intercepted; no provider/app access.
- Targeted lint and diff whitespace checks passed. The clean allowlisted
  integration build and hosted release/readback remain Coordinator gates.

Heavy verification is coordinated with the existing Coaching preview. Do not
overwrite the preexisting dirty `public/sw.js` with a full build in this lane.
Coordinator will build the immutable allowlisted release instead. Preserve the
untracked recap plan and both BRAI probes. No worker Git mutation or deployment.

## Remaining acceptance

Local source/type/browser checks are complete. Freeze exact paths/hashes and
hand off to Coordinator. Release requires actual deployed-source/readiness/single-volume
proof for both services and a bounded existing-AIOK readback of the corrected
view, without regenerating its analysis or sending notifications.

## Hosted verification follow-up: legacy Light label

Coordinator's existing-AIOK readback found a legacy text contract not represented
by the first fixture: Full Ladder used `light, extension`, whereas the compact
card used `weak, extension`. Synthetic outer rows outside the structured compact
map therefore survived the weak-only text check. Both cards contained actual LF
newlines; byte inspection and explicit LF/CRLF tests disproved the preliminary
escaping diagnosis. No transport conversion was added.

The narrow successor accepts the historical `light` synonym alongside `weak`
only in the existing source-generated, uncorroborated extension rule. Observed
light intraday levels, real extensions with retained structured/full-ladder
evidence, ambiguous structured rows with absent counts, support, AI analysis,
publication facts and raw storage remain unchanged.

The original weak-only selector was reproduced leaving outer legacy 22/23 rows;
the corrected selector removes those rows with the actual-LF fixture. Seven
evidence/read tests plus fifteen Gain/Loss regressions passed (22 total).
Explicit LF and CRLF tests verify normal newline outputs and unchanged inputs;
the legacy fixture also proves idempotence and real Light evidence preservation.
Targeted lint and whitespace checks passed. Successor source, regression test
and this record are handed to Coordinator without worker Git/deploy actions.
