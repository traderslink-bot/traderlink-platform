# News URL identity, destination memberships and sidecard labels

Owner authorized implementation and isolated synthetic QA; DO NOT DEPLOY. Premium enforcement stays off. PC collection, text reuse and AI remain unchanged. Base: 8890b66f77faf4a4b37675acb9d1315f166cf402. Coordinator-assigned lane: news-ingestion-current-main-20261122. Prior News source preserved separately.

## Findings and correction

POST /api/news/articles authenticates the PC publisher, then news-article-store performs the supported single-node SQLite upsert. Existing ticker+normalized-URL identity and retained slug already avoid same-ticker duplicate webpages. However a single priority route_tag cannot represent independent cap and Scanner destinations. Scanner-priority merging drops cap categories and can erase other nonempty fields. Additional source events were not retained. URL identity was ticker-scoped. A fallback company-profile call existed on ingestion. Some news metric labels were bare values.

Keep existing URL normalization (URL parsing, fragment removal, lowercase); never match headlines. Add unique normalized-URL and event identities plus a unique article/category relation in reserved migration 0227/order306. Preserve article IDs/slugs, original source_event_id/canonical_source_key and immutable versions. Resolve and merge under an IMMEDIATE SQLite transaction. Record a new destination/event even if article content does not need a revision. Conflicting event identities reject; historic duplicate URL identities fail migration for separate review, never silently merge/delete published pages.

Scanner membership comes ONLY from explicit default/spike destinations, never inferred from filters, cap or headline. Market-cap route tags persist independently. Existing numeric market-cap filters remain based on recorded cap metadata. All seven supplied tags are eligible; include larger cap tags in the legacy aggregate cap query. Use EXISTS so multiple matching memberships return one card/count. Readers retain legacy compatibility until the migration is separately approved/applied.

Preserve nonempty text/arrays and recursively merge useful metadata; Scanner wins populated conflicts but lower-priority submissions fill missing facts. Preserve the original ticker and publication timestamp/slug on an existing identity. Remove ingestion's company-profile lookup; no collection or AI on VPS. Notification enqueue retains the destination of the current submission and existing article/device deduplication and preference gates; no activation or new subscription policy.

Change ambiguous market-cap chips/compact values to “Market cap …”; retain Float and explicit article type/time labels. Update the Help Center explanation of Scanner versus general filtering.

## Verification inventory

- Cap then Scanner; Scanner then cap; retained cap/Scanner memberships, analysis, levels, extra metadata, one ID/slug/public URL.
- Repeated same/different source-event retries, same headlines/different URLs, same normalized URL/different ticker, fragment/case normalization.
- Independent connections/processes concurrently submit both destinations against one synthetic SQLite file; one canonical article and two memberships/events.
- Reopen database; all list/paged/headline/drawer/unread/read/scanner-recent queries retain correct memberships without duplicates.
- General-only articles stay outside Scanner; numeric cap boundaries, all five cap tags and legacy no-membership reader compatibility.
- Migration preserves article/version bytes and identity, backfills recorded tags, conflicts fail atomically; migration catalog and architecture checks.
- Endpoint authentication/response canonical URLs and no upstream fetch/AI; use isolated synthetic fixtures and stub notification delivery only.
- Desktop/mobile portrait/landscape, Light/Navy drawer/card labels, clipping and current outbound-link contract.
- Relevant focused tests, lint/type, final source allowlist and known limitations. No hosted tests, historical replay, Discord, production writes or deployment.

## Progress

Implementation complete. Focused storage/endpoint/regression checks, lint, targeted TypeScript, dashboard-template checks and all 24 scoped visual combinations pass across retained checkpoints. Production migration, final integrated CI/build, hosted public-page/installed behavior and existing-data preflight remain unrun. Owner approval is required for any deployment or production data operation.

Owner follow-up: align Manage alerts and Mark all read in the same responsive toolbar row as Search, Filters and Sort, with chips beneath; remove the duplicate mobile action above the card. Use recognizable outlined action buttons and wrap only when viewport space requires it. Include top-edge alignment and action label in desktop/mobile QA.

## Final review and limitations

The serving backend is single-node SQLite; the retained Neon adapter is test-only and is not claimed as qualified by this fix. The source-event/URL/category tables are additive. Existing duplicate normalized URLs deliberately stop migration atomically, preserving all old article/version rows and links for separately approved reconciliation. Historic categories discarded before a version was saved cannot be reconstructed without additional evidence; nothing is guessed or replayed. Migration registration is reserved at 0227/order306; the Coordinator must qualify the actual selected migration prefix before any approved production operation.

Existing notification subscription policy is unchanged; no new channel subscription activation or real delivery was performed. Legacy notification channels still have their existing schema limits; this slice qualifies category readers and existing notification gating, not new higher-cap notification options.

Help Center guidance now distinguishes market-reaction PR Scanner membership from general saved filters. The shared React review found no added effects, upstream data fetching or new theme overrides. The actual shared card component is mounted at /scanners; /screeners is a different stock-filter tool. Earlier harness target/selector/consent errors, own-cgroup OOM and type-fixture errors remain retained. No successful publisher submissions were replayed to improve reporting.

Native UI evidence covers /press-releases, /press-releases/news-filtered, /trading-workspace and /scanners at desktop, mobile portrait and landscape in Light/Navy. Earlier main-view images predate only whitespace cleanup in the filter controls and the later raw-payload-array preservation fix; final storage/endpoint tests cover that fix, and the final /scanners cohort uses its source. No compiled production build or hosted pass is claimed. Native fixture initialization printed a stale hardcoded 180-article count; independent readonly verification finds 8 articles, 8 URL identities, 10 source-event identities and 10 category memberships after the four genuinely completed synthetic publish calls.

The app defaults to all saved eligible history, 100 articles per page; no default age cutoff. Its database is Railway persistent storage in production, while PC text/AI reuse remains a separate 72-hour collector cache. Exact production retention inventory was not read in this task.
