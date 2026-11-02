# Live Market Scanner Audit QA — 2026-11-02

## Scope

This QA pass reviewed the preserved Slices 0–2 candidate against the approved
audit plan, exact production-base diff, owner authorization boundary, evidence
integrity requirements, five-second scanner isolation, admin API/UI behavior,
and current mixed-workspace regression state.

## Corrected findings

1. Candidate state was deleted when a ticker stopped qualifying, so a later
   re-entry could not emit an entry event and its best-score history reset.
   State now persists through nonqualifying observations.
2. Re-recording an existing cycle appended duplicate evidence before SQLite
   ignored the cycle identity. Cycle persistence is now idempotent before file
   append.
3. A process interruption between evidence fsync and the SQLite transaction
   could leave unindexed trailing bytes without a health signal. Startup now
   reconciles every known segment boundary, records a durable integrity event,
   and marks that trading date degraded once.
4. Audit Health could remain Complete after an active scanner stopped writing.
   Runtime health now marks a cycle older than 20 seconds Missing while the
   feed reports an active session.
5. The timeline route could return up to 20,000 full decision objects in one
   response. It now returns at most 250 cycles and supplies a cursor for older
   observations; the UI loads earlier pages on demand.
6. Enqueue synchronously cloned every full-universe cycle and synchronously
   wrote SQLite during overflow. Enqueue now retains the newly created readonly
   cycle and schedules overflow durability outside the scanner call path.
7. The Audit Health desktop metric grid used a malformed four-column CSS
   `repeat()` value. The corrected value preserves the approved two-column
   mobile layout and renders four columns at the desktop breakpoint.
8. The timeline's earlier-page action was hidden when the latest page contained
   no matching ticker. It now remains available whenever an earlier cursor
   exists.
9. Rejection pagination could combine different scan cycles when a new cycle
   arrived between pages. Its cursor now binds the immutable cycle and symbol.
10. Late Daily Review, timeline or rejection responses could populate newly
    changed controls. Control changes now invalidate pending requests and clear
    prior results and cursors.

## Verification evidence

- Focused Vitest: 33 passed in four files, one worker, no file parallelism.
- Full live-scanner Vitest regression: 96 passed in eight files, one worker,
  no file parallelism.
- Targeted ESLint: passed after corrections.
- Git whitespace validation: passed after corrections.
- Full repository TypeScript with a 4 GB heap passed after correcting the
  previously recorded `universe-alert.test.ts` fixture typing.
- The 1,251-symbol synthetic sizing test, checksum rejection, restart timeline,
  durable overflow gap, duplicate idempotency, unindexed-tail reconciliation,
  re-entry lifecycle, active-session staleness, Daily Review summaries,
  rejection pagination, owner authorization and independent decision
  recalculation all pass.

## Open gates

- The exact candidate production build passes after restoring the
  lockfile-declared `argon2` and `openid-client` packages to the VPS dependency
  tree. Academy registry validation, webpack compilation, TypeScript, all 284
  static pages and route generation completed successfully. The post-pagination
  correction build ID is `v11FdBJK6xoBBqxKpvo0a`.
- Isolated development-owner browser QA is complete: 12/12 cases passed after
  the final visual correction batch, including all four APIs, 120-row pagination,
  sparse history, stale responses, error/health states and desktop/mobile layout.
  Final scanner tests: 96/96; targeted ESLint: passed. See
  [browser QA record](live-market-scanner-audit-browser-qa-20261102.md).
- Non-owner/missing-session denial is covered by route tests, not browser login
  in this development-owner-injected runtime. Owner visual acceptance remains
  separate. The production build above precedes the final three UI-only changes;
  no later production build or deployment is claimed.

No source was pushed, deployed, or activated against production data by this
QA pass.
