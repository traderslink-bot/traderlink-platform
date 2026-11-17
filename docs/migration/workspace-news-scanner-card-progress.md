# Workspace News Scanner Card Progress

Related plan:
[workspace-news-scanner-card-plan.md](./workspace-news-scanner-card-plan.md).

## Current state

Journal Workspace no longer includes the PR Scanner card, toolbar button,
sidecard, or display toggle. The dedicated Workspace stream and preference
routes were removed. The shared article endpoint still serves Scanners and
Trading Workspace. Help Center instructions describe those separate surfaces
and still apply.

Chromium confirmed the Demo Journal controls on desktop and mobile without
PR Scanner UI or requests. Home rendered the Market News links, and Trade
Analyzer rendered a sample chart. The focused dashboard, API routing, Demo,
and Scanners suite passed 62 tests.

## Historical implementation

| Item | Status |
| --- | --- |
| Shared article reader extraction | Implemented locally |
| Entitlement-gated bounded Workspace endpoint | Implemented locally |
| Six-item Workspace card | Implemented locally |
| On-demand larger Workspace list | Implemented locally |
| Source QA and owner visual review | Static source QA complete; owner visual review pending |

## Guardrails

- Reuse News Scanner article facts and its existing access gate.
- Keep the Workspace initial server render free of article-list work.
- Keep the full News Scanner route intact.
- Do not create a second article reader, change scanner data, or alter read
  receipts outside the existing mark-read behavior.
- No dashboard server, broad test suite, production build, or release action
  runs during this design and implementation pass.
