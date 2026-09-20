# Premium Swing Trade Ideas

Status: implementation authorized; owner explicitly deferred visual review to production.
Progress: [Implementation progress](premium-swing-ideas-progress.md).

## Controlling scope

Create the first owner-authored CRML swing idea from the open Google Keep note.
Preserve exact words, grammar, numbers, dates and meaning. Only unambiguous spelling
corrections are allowed; retain a source-versus-published comparison. Do not silently
correct the note's apparent October year inconsistency. No AI rewrite or generation.
Capture the complete note and its bold headings, underlined dates and emphasis before
implementation; the prior visible excerpt is not a substitute for the full capture.

Routes: `/swings` index and `/swings/<random-opaque-id>` detail. Treat the later
singular `/swing` mention as shorthand for the approved plural route, not a second
feature. No ticker in URL. A cryptographically random identifier is obscurity only;
server Premium authorization is the access control. Existing Swing Tracker and
Swing Analyzer routes and trade records remain untouched.

## Locked preview (approved copy and order)

Largest text: **This swing trade idea previously had two runs, each offering well
over 100% in potential gains.**

**Premium members:** [Sign in] to view.

**Not a Premium member?**
[Join TradersLink Premium](https://whop.com/traderslink-1049/premium-access-2026),
connect your Discord account to Whop, then sign in to view.

**Inside This Trade Idea**
Company research, the catalyst behind the idea, previous price runs and my trading
plan—with pullback areas, breakout levels, risk limits and upside targets.

Do not reveal Greenland, rare earths, CRML, prices or other private details in this
preview. The same preview appears to signed-in Free and all signed-out visitors.
Do not infer whether an anonymous visitor has Premium. Sign-in returns to this
exact idea using an allowlisted relative return path. Whop link stays descriptive.
The teaser is owner-supplied promotional copy, not a new independently verified
performance calculation.

## Proposed presentation for owner review

Signed-in dashboard: existing header/sidebar; Swing Trade Ideas under Stock Tools.
Index: one idea card; Premium users can see its ticker/title, others see only the
approved teaser. Detail uses the Watchlist analysis visual language, light surfaces,
navy headings and generous section spacing. No ticker data in locked card markup.
Keep the author's original section order and titles: background paragraphs, History
of 2 previous runs, First run, Second run, My plan, Key levels (zones), First/Second/
Third Target Zone. Preserve emphasis instead of inventing new prose or subtitles.
Use a single reading column with grouped cards, responsive full-width cards inside
normal dashboard gutters; no horizontal table required. Teaser lead visibly larger
than membership instructions/body text; keyboard-accessible links and strong contrast.

Anonymous detail must show the teaser without the dashboard's current forced login.
Use the existing visual primitives in a scoped signed-out frame, not an authenticated
shell populated with private account data. Do not weaken global dashboard auth.
Owner will review teaser, member page and admin layout on production as requested.

## Verified source facts and access design

- `app/dashboard-layout-frame.tsx` currently requires an identity and redirects
  unauthenticated production requests to Discord login. A detail-specific branch
  must run before this requirement; leave other routes unchanged.
- `require-platform-request-scope.ts` supplies Discord membership roles with the
  Platform identity. `platform-discord-watchlist-entitlement.ts` checks the configured
  Premium role and existing guild-owner access. Reuse the established entitlement
  semantics rather than a new hardcoded role or Whop payment implementation.
- Verify role freshness/revocation and owner access against current release code
  before implementation. Missing role config, failed verification or absent identity
  must never return private content. Service outages are not proof of Free membership.
- Separate public teaser metadata from a server-only full-content registry. Fetch
  full content only after authorization; never serialize it to unauthorized HTML,
  RSC payloads, client bundles, JSON, metadata, OG images, search or sitemap entries.
- Authenticated content must not enter shared caches or service-worker offline
  storage. Inspect PWA navigation caching explicitly; recheck access on later visits.
  No false promise that access revocation can erase content already viewed/copied.
- Unknown idea IDs return a normal not-found state; no private title leaked.

## Owner activity view

Route `/admin/journal/swings`, title **Swing Idea Activity**, linked from the existing
Journal Admin navigation. Reuse `withJournalAdminPageDatabase` and existing owner
authorization for pages AND data endpoints. Ordinary Premium members get no access.

Summary: recorded visits, signed-in members, full-idea visits, locked-preview visits.
Filters: idea, member, date range, full/locked result. Default last seven days; all-time
available. Display dates/times in explicitly labeled Eastern time; store UTC.
Member table: Member, Idea, First visit, Latest visit, Visits, Viewed (full/locked).
Visit history: Member (or Anonymous), Idea, Date/time, Viewed. Server pagination,
bounded query limits, newest-first event history. No claims about reading completion,
attention, trade entry or actual profit. Counts describe recorded views, not all app
history. Explain each metric/column with concise ordinary-language tooltips.

Durable event contract: opaque event ID, idea ID, authenticated Platform user ID or
null, server receipt timestamp, server-derived access outcome, content revision.
Resolve identity and outcome on server; never trust browser member IDs/Premium flags.
Record one visible page opening with a per-opening idempotency key; rerenders,
transport retries and prefetches do not add visits. A deliberate reload or reopening
is a new visit. No recurring heartbeat polling. Back/forward restoration behavior
must be defined and tested as one new visible opening, without duplicate handlers.
Anonymous totals are visits, not identifiable people or unique visitors. No IP,
fingerprinting, raw cookie/token or unnecessary device collection. Rate-limit public
intake independently without blocking reading; avoid persistent anonymous identity.
Tracking failure must not block Premium content; log recording failures and do
not promise every view can be captured if a browser blocks requests or is offline.
Do not retroactively invent visits. Proposed retention: retain member event history
until account deletion under existing deletion policy. Anonymous daily aggregation
is deferred; raw anonymous/deleted-account events expire after
30 days and are excluded from older admin results even before the next cleanup.
Coordinator requires ON DELETE SET NULL, preserving anonymized events within that
window instead of deleting them immediately. Member records remain while the account exists.

Existing `watchlist-usage-service.ts` records user/timestamp events and aggregates,
but does not provide this complete idea/access/history model. Do not repurpose or
overwrite those records. A narrow new Platform activity table/migration is expected;
Coordinator must allocate ID and approve guarded application. No migration now.

## Implementation boundaries and expected allowlist

New swing routes/components, server-only content/access/activity services, a visit
endpoint and recorder, owner admin route/read model, focused tests. Narrow integration
edits only to dashboard navigation, Journal Admin navigation, applicable PWA exclusion,
migration manifest/register, Help, this plan and progress. Exact paths to be enumerated
after current-parent reconciliation; do not edit shared files blindly in dirty e70f.
Read relevant installed Next.js docs/skills before writing route/component code.

No new publisher UI, AI calls, live prices, alerts, Discord posts, email/push delivery,
Watchlist generation changes, provider requests or trade-analyzer changes.

## QA and release gates

1. Review this plan for auth leaks, login flow, source fidelity and tracking semantics.
2. Present page/admin design and preserve owner UI approval boundary.
3. Implement a complete narrow slice; use small focused checks only while coding.
4. Test signed-in Premium, Premium signed out, signed-in Free and anonymous access.
   Also test expired sessions, role removal, missing configuration, failed role lookup,
   direct API/RSC/metadata/cache access, malicious return paths and unknown IDs.
5. Verify no prefetch/retry double-counting, real revisits count, per-idea/member filters,
   anonymous separation, UTC/ET date boundaries, account deletion and admin protection.
6. Compare published text and emphasis against the full Keep source; spelling-only
   diffs. Check mobile 360/390/620 and desktop, login return and Whop link.
7. Update member Help plus owner activity guidance. Run focused low-resource checks
   at checkpoint; no broad tests/builds/server during design review.
8. Narrow local commit, complete allowlist and verification/migration risks to Coordinator.
   Production publishing/migration remain separately coordinated; no independent deploy.

## Plan QA pass

Resolved: anonymous preview vs forced-login shell; URL obscurity vs authorization;
Free users misclassified by dashboard-wide Premium setting; cache/metadata leakage;
prefetch counts vs actual visits; anonymous identification limits; analytics outage
blocking content; exact source preservation and distinction from Swing Analyzer.
Implementation decisions: Premium role evidence is valid for five minutes; stale
evidence uses the existing Discord bot token for a bounded member-role check, cached
for five minutes. Failure returns no private content; the scoped Sign in path refreshes
OAuth evidence even for an existing session. No new secret, Whop entitlement or payment
system is created. /swings explicitly requires online access and excludes offline
projection capture. Coordinator reserved 0139 after exact 0138 predecessor.
