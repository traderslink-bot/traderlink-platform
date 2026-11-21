# PR Scanner restoration and Market Events float parity

Owner scope: restore PR Scanner under Trading Tools, keep all ordinary news on Press Releases, retain Trading Workspace PR sidecards. Premium enforcement and notification settings remain unchanged/off.

Base: fad9a2d981fa66645b5bb0a29c5d79ce9cbc6986 in the Coordinator-assigned News lane. Old93f feature/evidence files remain preserved. Coordinator owns Git and release; navigation13 is separately frozen and must be composed as narrow additive hunks.

Discovery: the catch-all page redirected every non-all channel, and feed server action always requested all; restoring a link alone would not restore the scanner. Existing repository supports channel filtering before pagination. Restore only news_filtered, keep retired market-cap routes redirected, and carry its scope through initial query/filter/refresh/pagination. Account filter preference remains account-owned across feeds.

Float: Market Events requested exact-date-only scanner cache via admin floats; Company Details falls back to the existing cached company profile with floatingShare in millions. New bounded authenticated News endpoint reads valid scanner shares first, then missing symbols from that same profile; exact ticker match, explicit million conversion and positive safe shares required. No stale-day guessing, shares-outstanding substitution, cache writes, new provider credentials or shared cache behavior. This explains a possible source mismatch; no actual production ticker diagnosis is claimed.

Help: paid-plan-guides News paragraph updated for the two destinations. Existing appearance/components retained.

Verification: four focused files28/28PASS and targeted13-filelint0. Initial typecheck reported3 union-narrowing errors in the new navigation test; retained failed receipt. Corrected that test;13roots/690reachable source files0 diagnostics. Affected route plus required dashboard-template suite17/17PASS (route cases repeated, not45 distinct cases). Serialized guarded processes settled, QA lock removed/common guard independently free. Receipts under /tmp/news-scanner-current-qa-20261121: results-v1.json, results-types-v1.json, results-correction-v2.json. Independent source peer and desktop/mobile Light/Navy fixture/native acceptance remain pending. No production/provider effects, build, browser or deployment performed.
