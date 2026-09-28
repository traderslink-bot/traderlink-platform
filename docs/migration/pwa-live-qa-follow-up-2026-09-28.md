# PWA live QA follow-up — 2026-09-28

Status: sampled live browser audit complete; follow-up corrections prepared, not deployed. Android push receipt and remaining speed work stay open.

Controlling record: [PWA speed repair progress](pwa-speed-repair-progress-2026-09-28.md). Owner authorized continued investigation, fixes and release Coordinator communication.

## Live evidence

Production source reported by Coordinator: `ff6b0521c43fb24e5bd1f3f4f81e52be01b149b4`. Authenticated Chrome checks used a dedicated QA tab, not an installed Android device.

- Workspace initial document response/load: 981/1824 ms; one compact scanner request, 164 ms and 1,185 transfer bytes. Later navigation: 796/1436 ms, one compact request.
- After applying the existing Update app action: 3386/3994 ms document response/load, scanner 926 ms. Service worker activated, no waiting update afterward. This slow sample remains unresolved.
- Expanded scanner: 1115 ms and 908,957 transfer bytes; article opened successfully. A subsequent read-only fetch returned 60 articles: 908,656 JSON bytes versus 12,332 bytes projected to ID, ticker, headline, read state and publication time (98.6% smaller). This is not a deployed transfer or phone speed measurement.
- Compact card detail: 174 ms, 37,356 transfer bytes; article drawer rendered correctly.
- Watchlist document response/load: 401/816 ms. Sampled data requests: 147/163/175 ms, about 2,973 bytes, normal 15-second polling. List and APUS detail had no horizontal overflow at 390 px; cards and TradingView content rendered. No console errors captured in those checks.
- Offline emulation displayed the existing offline message and retained the route. Network and viewport overrides were restored. Closed-app offline launch, the 12-second fallback and background pause/resume were not verified.
- Desktop permission was granted but there was no push subscription. This does not establish Android subscription loss. The enable action was confusingly labeled Set Preferences. The setup banner is intentionally installed-app-only. No subscription or alert choices were changed.

## Prepared corrections

1. Expanded scanner requests a 60-headline summary including dates. Existing default, compact summary, expanded full and detail API contracts remain available with unchanged authentication and channel restrictions.
2. Article body and drawer load on selection. Latest selection wins; closing aborts requests. List and article requests have 12-second limits and plain-language failures.
3. Enable button becomes Turn on notifications; category saving becomes Save alert choices. A prepared disconnected device gets an explicit off message. Handlers, subscriptions and choices are unchanged. Help Center action wording is aligned.

Source allowlist:

- `app/(dashboard)/workspace/workspace-news-scanner-panel.tsx`
- `app/api/platform/news/workspace-scanner/route.ts`
- `app/(dashboard)/account/notification-preferences.tsx`
- `src/modules/help/traderslink-app-guides.ts`

## Verification and preservation

- Four candidates passed focused TypeScript transpilation/syntax and ESLint with no errors or warnings. This is not full typecheck, build, behavioral or candidate browser acceptance. No Vitest or broad suite ran.
- Exact-production source-only candidates preserve the heavily mixed canonical source, real Git index and HEAD. Immutable patch/checkpoint metadata: `qa-evidence/pwa-live-qa-follow-up-20260928.json` and matching `.patch`.
- Coordinator must reconcile the release parent and complete focused integration/build acceptance. This task does not deploy.

## Open work

- Android press-release/halt receipt and notification-click navigation remain unverified. Permission and health are not delivery evidence. Aggregate delivery/queue evidence is still outstanding from Coordinator.
- Workspace logs show different dominant phases: a 2361.5 ms request spent 1724.9 ms in dashboard runtime; a 1221.8 ms request spent 703.9 ms in identity. Nested timings overlap and must not be summed. Identity already has React request caching; reporting preparation has an existing cache. No speculative database/cache change is included.
- Watchlist Package B remains excluded until a production-aligned build and actual chunk measurement. These live desktop samples do not justify removing Watchlist from the PWA.
