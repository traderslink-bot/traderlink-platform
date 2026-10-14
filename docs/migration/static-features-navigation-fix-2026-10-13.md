# Static Features navigation repair

Status: Implementation and browser verification complete. Owner review and publication pending.

## Scope and implementation

Repair blocked Features dropdown links on `/trading-journal`, `/trade-analyzer`, and `/trade-analytics`. Keep navigation above hero content by changing the later header rule from `z-index:1` to `z-index:30` in each static HTML file. Preserve current layout and navigation behavior.

Source baseline: `f953b319e49b50e6b2cb7a24d242fcedcf581b72` from `codex/railway-public-static-root`. All three baseline documents matched live responses after normalizing line endings. Live responses identify Railway as the public static host.

Worktree: `/tmp/traderslink-static-nav-fix`; branch: `codex/static-features-nav-fix-20261013`. Shared Platform checkout changes were preserved.

## Verification and release boundary

Live Chromium reproduction confirmed the dropdown opened on all three pages, but hit testing at the Trade Analytics link returned the hero image or container instead of the anchor.

Candidate browser QA uses Playwright request interception to serve the changed local static HTML and assets at the public URLs. This verifies candidate behavior without modifying the public deployment or starting the dashboard. Check all four feature links on all three pages at 1440, 1024, 768, and 390 pixel widths, plus keyboard opening, Escape closure, and click-away closure.

No TypeScript, Next.js, server, authentication, route, or data-contract changes. No application build required for three static CSS values. Help guides need no changes because navigation labels, destinations, and documented workflows remain the same.

No push, merge, deployment, hosted configuration change, or data operation authorized or performed. Before release, verify actual static service source metadata and use the applicable owner-approved release lane; do not assume the private Platform service is the target.

Results: Chromium passed 48 actual feature-link navigations across all three pages and four viewport widths. Keyboard opening, Escape closure, and outside-click closure passed in all 12 page/viewport combinations. The mobile harness was corrected to reopen the main menu after Escape and inspect the hidden Features button after outside-click closure; no additional product change was needed. `git diff --check` passed.
