# Press Release Dashboard Progress

**Status:** Implementation active

**Controlling plan:** [Press Release Dashboard Plan](press-release-dashboard-plan.md)

## 2026-08-20 owner-approved design

- [x] Preserve Discord delivery and existing public article pages.
- [x] Use a left-navigation Press Releases group; no top-navigation shortcut.
- [x] Show total and per-channel unread badges.
- [x] Use one-line desktop rows and responsive article drawers.
- [x] Show stored market cap in the All Market Cap list.
- [x] Reuse one canonical article rather than duplicate content.
- [x] Keep article history; do not add automatic deletion.
- [x] Deep-link PWA Push to the exact authenticated article drawer.

## 2026-08-23 public article shell alignment

- [x] Use the exact public Help Center header on detailed News article pages.
- [x] Preserve the canonical News content, free-article variant and public footer.
- [x] Align the dashboard and Help header to the detailed article page's light logo asset.

## 2026-08-25 feed headline correction

- [x] Render only the article headline in the shared feed headline column; no feed-row snippet or summary preview appears on desktop or mobile.
- [x] Let mobile feed headlines wrap fully within the available width without a no-wrap, line-clamp, ellipsis or clipping style.
- [x] Preserve the article drawer's full stored AI summary and every non-snippet feed action, filter, link and data behavior.
- Help guidance does not need an update: it covers channel browsing, unread badges, Push choices and opening articles, not removed feed-row snippet text.

## Implementation checklist

- [x] Add the News read-receipt and Push-preference migration.
- [x] Add News feed, unread-count and mark-read services.
- [x] Add idempotent Premium-user Push fanout after article publication.
- [x] Add Press Release Push choices to Account Preferences.
- [x] Add navigation group, exact channel links and unread badges.
- [x] Add channel pages, compact responsive list and article drawer.
- [x] Add PWA payload content and exact drawer destination support.
- [x] Add the Account Preferences alert link to every channel page.
- [x] Add Help coverage and contextual Help link.
- [x] Group AI and Trade Data links, keep Market Charts standalone, and move Press Releases below it.
- [x] Move Account and context-aware Help to the top bar.
- [x] Fix an active Press Releases route forcing its navigation group open.
- [x] Complete focused static verification.
- [ ] Complete owner visual/product review.

## Preservation notes

- The shared checkout began with unrelated modified migration/progress and
  project-log files plus an untracked community plan. This feature will not
  overwrite, stage or absorb those files.
- The owner later authorized the shared protected-database checkpoint after the
  concurrent AI Chat owner confirmed migration 0071 was ready. No provider
  call, Push delivery, deployment, public publication or Discord operation
  occurred.

## 2026-08-20 source checkpoint

- Migration `0070_news_press_release_dashboard` owns sparse global read
  receipts, exact Press Release Push choices and bounded delivery evidence.
- The ordinary notification bell remains unchanged. News reuses only the
  encrypted Platform device subscription and common delivery transport.
- Production Push destinations enter through the existing Discord login route
  with the exact channel-and-article return destination. An active session
  redirects immediately; an expired session returns to the same drawer after
  OAuth.
- Focused ESLint and the corrected 19-file feature-scoped TypeScript check
  pass. The initial whole-project check exhausted its 2 GB Node heap, and the
  first scoped attempt inherited the repository-wide include pattern and hit
  a 1 GB cap. The corrected scope passed without increasing that cap.
- The owner-approved navigation refinement orders the sidebar as `Trades ->
  Trade Analyzer -> Analytics -> AI -> Trade Data -> Market Charts -> Press
  Releases`. Account and context-aware Help move to the top bar. All six exact
  Press Releases destinations remain unique.

## 2026-08-20 protected migration and runtime checkpoint

- The concurrent AI Chat task confirmed migration 0071 was ready and directed
  normal manifest order 0070 then 0071. The owner explicitly authorized the
  combined protected migration.
- The unique pre-migration backup/restore pair
  `pre-0070-0071-20260821T003306Z` verified 69 registry rows, exact table
  counts, page geometry, byte-identical backup/restored copies and recovery
  authority before any database write.
- The normal migration runner applied exactly
  `0070_news_press_release_dashboard` then
  `0071_coach_ai_chat_quality_feedback`.
- The protected database verifies at 71 migrations with exact schema digest,
  foreign-key check, quick check and integrity check all passing. All three
  Press Releases tables and both AI Chat quality tables began empty.
- The unique post-migration backup/restore pair
  `post-0070-0071-20260821T003542Z` verifies 71 registry rows, 176 user tables,
  exact counts, page geometry, recovery authority and byte-identical
  backup/restored copies.
- Existing port 3010 loaded `/press-releases` and Account Preferences without a
  restart. Desktop and 390-pixel mobile checks show the shared shell, all six
  channels, the top Account alert link and responsive empty state. Account
  Preferences shows the four exact Press Release alert choices. Browser logs
  contain no errors.
- The one preserved local News adoption row has route tag `local`, so it is
  correctly excluded from the eligible alert feeds. No fixture or copied
  article was inserted merely to populate the visual checkpoint. Row, unread
  badge and drawer acceptance remain evidence-gated until an eligible real
  article is published or the owner authorizes a separate non-production
  review fixture.
