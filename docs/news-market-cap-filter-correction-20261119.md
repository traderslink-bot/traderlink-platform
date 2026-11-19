# Market-cap filter correction — November 19, 2026

Owner reports selecting below5M or30M shows all caps, while the applied cap chip does appear. Current production source93f14371ef2afde7f132c3b2e6e0528053f794ba was confirmed by Coordinator. Its relevant News application source matches the assigned22cd feature checkpoint.

## Consolidated finding

The shared cap normalizer prefers secondary marketCapValue as dollars, even when the displayed explicit-unit marketCap contradicts it. Actual-source reproduction: display$50M/value50 normalizes to50 dollars; display$900M/value900 normalizes to900 dollars. Both match below5M/below30M incorrectly. A failing SQL repository regression reproduces below5 returning all six4M/5M/20M/30M/50M/1.2B examples (first constructed reproduction), then actual zero-placeholder/spaced-unit shapes were added. The earlier synthetic fixtures had no secondary numeric field and missed this combination. Coordinator subsequently supplied a read-only sample of20 real current rows: ALL marketCapValue fields are integer0 placeholders, alongside valid spaced displays such as144 M,353 M,46.0 M,2.7 M and260 k. This confirms the live cause. Against that exact public sample, the original normalizer matches20/20 below both5M and30M; the correction matches4 below5M and6 below30M. No production writes were involved.

## Narrow correction

Ignore zero/invalid secondary placeholders. Preserve positive USD precision when consistent with the displayed rounding (e.g.5.00 M plus4999999 USD); otherwise use the explicit display units. Retain the positive recorded-dollar fallback when the display is unavailable; an unavailable display plus zero remains unknown. Both feed filtering/sorting and saved-view notification matching use this shared function. No ingest, article identity, source evidence, publisher/Nuntio link behavior, stored metadata, policies or schema changes. Premium enforcement remains OFF.

## Verification ledger

- Before fix: new SQL regression fails,10 existing checks pass; below5 returned all six test rows.
- After coherent source/test batch: three affected suites30/30 pass; targeted three-file lint passes; current-source typecheck3roots/362files/0diagnostics.
- Regressions cover below5, below30, lower-bound30, cap ordering, exclusive boundary, zero/string/consistentUSD secondary values, billion display, positive numeric precision/fallback, unknown zero fallback, and saved-alert matching.
- Native browser verification PASS: five targeted cases on actual93f production source plus this correction, fresh isolated210-schema data, native signed session and unchanged actual Next server actions. Under5 POST returns260 k/1.7 M/2.7 M only; under30 additionally5.0 M/14.0 M;144 M/353 M/46.0 M excluded. Preset, account preference reload, mobile Navy Dark and desktop Light pass with0JSerrors. No action/auth response stub or old820 compiled output was used.
- Current live data-shape/source and serialized release are Coordinator-owned. No worker push, hosted write, migration, notification send or deployment.

Help review: existing instructions already describe USD millions and exclusive Below bounds; this is a correctness correction without a new user workflow, so no guide wording change is required.

## Final proof and release boundary

Native receipt: /tmp/traderlink-news-cap-filter-fix-20261119/native/result.json; actual five-case browser response proof: /home/traderlink/preview-runtime/news-membership-native-20261118-capfix-PimMC9/cap-browser/result.json. Runtime closed18:27:13.652321UTC: both units inactive/MainPID0/empty cgroups,3010 closed and owned guards released. Product postimages and all QA input hashes stayed unchanged during the passing run. Earlier attempts are preserved in native/attempt1 and native/attempt2: missing promise handling then delayed consent banner blocked Apply; only external QA driver readiness changed. Server peak approximately3.5GB, browser below500MB, no OOM or other-preview action.

Coordinator changed the existing assigned checkout baseline safely to93f on codex/news-cap-current-production-qa-20261119, retaining old22cd branch and all unfinished/proof files. New fix needs no migration or policy change. Production publication remains Coordinator-owned; local source/browser pass is not a live deployment claim. These final documentation statuses were updated after passing native source/hash/runtime closure; application source remains the tested bytes.
