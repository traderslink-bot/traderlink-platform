# Trading Workspace QA6 and chart-title removal

Owner requested another QA/fix pass after preservation0d08decc, then explicitly asked to remove the TradersLink + TradingView charts title from the workspace sidecard and any other chart. Deployment remains held. Exact source search found two active drawer headers: workspace/live-screeners-client (/trading-workspace) and screeners/live-screeners-client (/scanners and /admin/scanners). Removed only those two Typography lines; remaining controls retain their existing row, no blank title spacer, public attribution unchanged.

Discovery inventory: title absent on desktop/mobile in both active drawer versions, header controls/close still accessible, chart preferences load/error paths, one/four chart restore, drawer coverage/return, mobile layout orientation and saved configuration. Existing31focused/source checks form the accepted baseline but new results must be reported separately. All live outputs external to watched source; isolated actual Next/local identity with synthetic market data only. No hosted data, publication or deployment. Root owns source preservation.

Source review found an initial preferences failure may leave only a Skeleton because owner/layout readiness prevents mounting the renderer's existing error UI; confirm in the actual browser before choosing a correction. No extra functional changes implemented yet. Normal browser order coordinated with News; no runtime held.

Actual component discovery test confirms initial preference failure renders no alert/action (one failing test, expected alert was null). Coherent correction adds a short initial-load error and outlined Reload page button to the page-card fallback using the already-loaded preference context. It never displays provider/internal error text and does not label a still-pending request as failed. No new timers, automatic retry, data restrictions, schema or API contract; reload uses ordinary browser reload and retains saved configuration. The approved title removals remain exact two-line deletions. Final source/UI checks and one coordinated private browser retest cover both changes together.

## Final qualification and actual private browser retest

32focused tests/7files PASS (including the actual component's initial-error/pending distinction and all retained lifecycle/preferences/geometry/mobile-layout cases). Targeted TypeScript10source/support/test paths PASS, lint on3changed TSX files and the regression test clean, diff check clean. No new numerical indicator/data algorithms or API/schema changes.

Private normal Next/local-development identity, real preferences/layout guards and synthetic market data. After explicit News focused-process closure, one finite normal guarded batch qualified both changes. No hosted user cookies/data/provider requests. Before running cases, corrected ONLY the generated external fixture's tradingDate/basisDate to America/New_York: UTC had rolled to Nov19 while the trading session was still Nov18. Preserved source fixture untouched; browser/stream helpers restarted before test cases, still inside the same finite resource window. All live output remained outside watched source, no source edits during runtime. CSS drawer transition waited until the actual Close control fit the viewport before asserting geometry.

ALL6 actual browser checks PASS,0page/window JavaScript errors:
- Trading Workspace desktop drawer: requested title absent, header controls present and Close fits.
- Trading Workspace mobile portrait: title absent, Close reachable.
- Four workspace candle panes paint and restore exact saved configuration after normal reload.
- Separate /scanners desktop route: title absent in its active drawer implementation, header controls and Close fit.
- /scanners mobile portrait: title absent and Close reachable.
- Deliberate initial preferences network failure: plain error and outlined Reload page visible, saved four-pane configuration unchanged. Removed failure injection and clicked the actual button; the page reloaded and restored all four candle panes with the same saved configuration and no remaining alert. Expected injected network console error is not an unhandled script error.

Visual review of Workspace mobile header and dark-mode error/action confirms no old title spacer and a visible normal outlined control. Static source search finds no remaining requested title in app/src. The same second drawer implementation serves /admin/scanners; that source path is covered, but a separate admin browser session was not claimed. Public attribution page/full notice untouched.

Actual resource closure Nov19 00:04:59UTC (Nov18 local owner date): own guard/browser/stream/preview inactive,3010/3097/3098 absent, normal marker absent and common flock acquired/released. News notified next. Source and synthetic DB/keys/frozen shared donor preserved, no Git index/ref/push/merge/deploy by worker. Root owns narrow local preservation. Deployment remains HELD; no migration required.

Proof retained under data/workspace-chart-qa6-20261118 (final context/results, source checks, error-before-fix test and screenshots). Own .next and /tmp/traderlink-chart-qa6-20261118 now have ended runtime purposes after this complete pass; cleanup owner must independently validate exact preservation and current guard/process state before any separately authorized cleanup. All prior exact failed-script evidence, final source packets, shared dependencies, other runtimes, source and isolated DB/keys remain protected.
