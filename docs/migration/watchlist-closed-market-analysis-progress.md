# Closed-market analysis progress

[Plan](watchlist-closed-market-analysis-plan.md).

- Owner approved implementation; source implementation and bounded offline checkpoint complete. Deployment and real ticker acceptance remain pending.
- Confirmed three related blockers: closed-session generation guard, same-day-only Moomoo request, and live-only reference freshness selection.
- Confirmed closed-session activation currently bypasses initial analysis review and persisted admission disallows closed-session generation. Both must change with generation eligibility.
- Coordinator assigned the existing clean runtime checkout `C:/Users/jerac/.codex/worktrees/watchlist-source-selector/levels-system-post-mtf-handoff-stability`, branch `codex/watchlist-history-runtime-release-20260921`, parent `48619cb2b0e22c80a860ecb2d6952f7c5833a861`. Canonical mixed files and deprecated sibling were not edited. Platform Help/docs remain in e70f.

## Implemented

- Owner additions and manual refresh are allowed while closed, subject to master generation. Closed-market drafts require review even if the open-session review option is off. Auto-sourced additions and background/startup/visibility updates gain no generation permission.
- Closed admission true survives persistence; existing false admissions stay false. Notes-only choices and open-session switches remain effective.
- Moomoo requests one bounded 04:00–20:00 ET window for the latest completed exchange trading date. Runtime also retrieves the preceding session and existing daily/4h history. Weekends, holidays and DST use the exchange calendar.
- Reference selection uses the newest actual 1m/5m candle in that completed session, preserves its timestamp and does not invent a current price when that session is absent. Live-session freshness rules are unchanged.
- Both analysis prompts receive completed-session guidance. The packet records actual market-data time separately from request time. Existing manual status copy and Help explain the behavior; no new UI control.

## Verification

- `scripts/verify-watchlist-closed-market.cjs`: 23 bounded offline checks passed, including calendar/window selection, master/session/notes/auto controls, persisted admission normalization, private publication policy, reference selection, packet date, single mocked Moomoo request and prior-session history. Executes small source modules and AST-extracted actual manager methods; no full runtime boot.
- All 9 modified TS files transpile without syntax diagnostics; generated Admin inline JavaScript parses. Runtime `git diff --check` passes.
- Existing review-policy suite: 7/7 pass, including real disposable store/reload and approval behavior. Existing price-action suite: 9/10 pass; the pre-existing `turns repeated overlapping one-minute bodies into an observed acceptance candidate` failure is reproduced using the exact unchanged parent price-action module. That test expects a micro acceptance candidate in the principal pullback list, which the prior source already separates into momentum context. No unrelated pullback changes made.
- The initial Windows ESM runner encountered `uv_os_get_passwd` before tests; the suites ran via the existing TSX CommonJS loader with a process-local userInfo fallback. No dependency install or persistent OS change.
- No paid requests, provider calls, notifications, local server, broad suites/builds, migrations, deployments or hosted settings changed. Syntax/offline checks do not establish real provider delivery or analysis quality.

## Release/acceptance boundary

- Runtime source requires its existing Platform Moomoo candle bridge; the bridge already accepts a historical window up to 24 hours, so no route/provider/auth change is required. No schema, variable or migration changes.
- Coordinator alone owns release. Deploy the runtime and integrate only the new Help paragraph plus these two docs, preserving all other mixed Platform work. Never copy the entire dirty Help file over current production.
- After release: add an owner-selected ticker with Generate analysis checked, confirm latest completed-session price/date and complete draft, confirm member page/Discord/push/email remain unchanged before approval, then let owner review and choose publication/notifications. Also check manual refresh of an existing ticker retains its old public analysis until approval. Live testing is not claimed complete.
