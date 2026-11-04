# Community branded content foundation — 2026-11-04

## Scope

This slice implements the owner-approved coding foundation for server-owned Alert, Watchlist, Swing and general-content feeds. It keeps Community separate from Coaching, Paid Channels, Shared Alerts delivery and the Admin Watchlist product. Visual card composition, collapsed/expanded behavior and final setup/authoring layouts remain deferred for owner review.

## Contracts

- Branded pages have stable UUIDs, readable slugs, aliases and a platform-configured per-community allowance. Only active branded pages consume capacity. Categories are independent, have stable IDs for Stats and do not consume capacity unless the owner explicitly creates a branded category-feed page.
- The one-segment publisher/category URL space is collision-free because every active page type has one unique slug namespace. Publisher-category feeds use two segments. Old slugs resolve through aliases.
- Publishers require an explicit page assignment. Own edit/delete permissions are separate. Moderating another publisher requires `can_moderate`; the verified server owner can manage all pages and placements.
- Alerts, Watchlists and Swings may store publisher-authored targets, support levels, stop loss and take per ticker. Those fields remain distinct from TradersLink-supplied metadata.
- Publication price is captured from the existing EODHD-backed price state and is insert-once. Finnhub supplies company, exchange, industry, website and market-cap fields according to actual availability. Unavailable and stale evidence is explicit.
- Signed-in feed visits extend existing Community activity and Community Stats records with stable page, category and publisher dimensions. A visit is not a like. Anonymous attribution is not implemented because these routes remain signed-in and membership-gated.

## Implementation boundary

Migration `0177_traderlink_community_branded_feeds` adds the page, allowance, category, alias, assignment, display-setting, placement, Swing, general-content, per-ticker snapshot and audit tables, plus dimensions on existing activity/Stats events. The repository and service enforce capacity, ownership, publisher permissions, stable resolution, bounded newest-first feeds and immutable snapshot insertion. Minimal routes exist for data/permission verification only and are not the approved visual design.

## Verification rule

After steps 1–11, run no more than four source/static QA passes. Stop at the first clean pass. Vitest and other test suites remain excluded by the owner’s task-specific instruction. Then qualify the isolated Community preview without hosted effects or real delivery.

## Owner-approved product model — 2026-11-04

The next product revision simplifies the public structure to three page families:

- `/alert/...` contains alert-oriented pages.
- `/watchlist/...` contains watchlist-oriented pages.
- `/content/...` contains article and educational pages.

Swing is a presentation template, not a separate top-level page family. A server may therefore create routes such as `/alert/swing` or `/watchlist/swing`. The current `/swing/...` foundation is migration evidence and must receive a planned compatibility redirect before that route is retired. Existing stable page IDs, placements, Stats history and aliases must survive the change.

Alert and Watchlist owners choose the page family for organization, then choose the presentation template independently. Initial shared presets are:

- standard Alert card;
- list-style Watchlist card; and
- detailed Research/Swing card with a longer thesis, commentary, targets, support, stop loss, charts and publisher take.

These templates are available to both Alert and Watchlist pages. The family does not restrict which preset a server may use. Template selection controls presentation and authoring fields; it does not create another permission, delivery or analytics system.

### Content presets and customization

Every `/content/...` page uses the same structured content system. Initial presets are:

- Article;
- Research Report;
- Guide/Tutorial; and
- Brief Update.

An owner may duplicate a preset and customize a bounded template. Customization includes the template name, page title, optional subtitle, ordered section headings, text sections, image sections, callout or key-point boxes, author identity, published date, category/topic label and an optional disclaimer or footer. Owners may rename, reorder or hide supported sections. Arbitrary HTML, scripts and unrestricted layout code are excluded.

User-added external links are excluded from the first redesigned Content editor. This keeps the beta consistent and reduces spam, tracking and moderation risk. Existing foundation resource-link data must be preserved until the implementation plan specifies its compatibility treatment; it must not be silently deleted.

## Deferred image-upload phase

Image upload and processing comes after the template and authoring revision. It is not part of the current implementation checkpoint.

The planned limits are:

- one optional cover image per post, maximum 5 MB and 2,400 × 1,350 pixels, presented as a wide 16:9 image;
- up to four body images per post, maximum 3 MB and 1,920 × 1,920 pixels each;
- JPEG, PNG and WebP inputs only;
- a target of about 500 KB or less for each processed image when quality permits;
- a 10 MB processed-image ceiling per published post; and
- a visible, configurable storage allowance per community.

SVG, GIF, external image URLs, hotlinked images, embedded HTML and tracking pixels are excluded initially. Only assigned publishers may upload. Owners and authorized moderators may remove images. Unpublished draft images should expire after 30 days unless still attached to an active draft.

Processing should run in TraderLink with Sharp or an equivalent maintained server library: verify the actual file type, reject malformed files, strip metadata, resize, re-encode to WebP, create responsive variants and generate safe object keys. Processing does not require a paid transformation service. The processed files should ultimately live in object storage rather than the application volume. Cloudflare R2 is the preferred initial storage candidate; Cloudflare Images remains optional and is not required for beta. Final storage credentials, quotas, backup policy, deletion behavior, malware scanning and cost controls require a separate implementation and release plan.

## Stable destination behavior

Alert and Watchlist destinations keep permanent URLs that members revisit. The public page is rendered from current database state; publishing does not generate or replace a webpage.

An Alert destination is a newest-first feed. Publishing an Alert appends a new card at the top of the destination while earlier active Alerts remain below it. A Discord message may identify a specific Alert with a focus parameter that scrolls to and highlights that card while keeping the destination URL canonical. An Alert does not require its own public detail page.

A Watchlist destination is a current-state ticker board. Adding a published ticker creates or activates that ticker on the public board. Editing changes its configured fields. Removing it removes the ticker from the current member board while retaining private audit/revision evidence. Examples include `/watchlist`, `/watchlist/options` and an owner-approved publisher-specific destination such as `/watchlist/options/avery`.

The Community Watchlist add form is driven by the destination template. Supported optional fields include ticker, targets, support, stop loss, concise member-facing notes, publisher take and later chart fields. The server owner, or another role explicitly granted configuration authority, decides which fields are present.

The add workflow has two choices:

- **Publish to members selected:** Add ticker writes the management record and immediately makes it active on the member Watchlist.
- **Publish to members not selected:** Add ticker saves it only in the management list as a draft. An authorized publisher can review, edit and publish it later.

Both published and draft tickers remain visible in the management list with the actions allowed by the publisher’s role. AI is not part of the Community Watchlist beta. The private TraderLink Admin Watchlist uses an AI processing and owner-review stage, but that delay is specific to TraderLink’s internal workflow and must not be imposed on communities.

If enabled in the template, TraderLink captures company details and a non-live price snapshot automatically when the ticker is published. The card labels the value **Price when added** and includes its observation date and time. Provider failure must not block authored ticker publication; automatic fields remain explicitly unavailable until a later authorized refresh.

## Multi-community runtime and performance architecture

Community Alert, Watchlist and Content destinations run inside one shared multi-tenant TraderLink application. A community or destination does not receive its own process, server, worker or Watchlist runtime.

The private TraderLink Admin Watchlist runtime remains a separate advanced product because it coordinates live prices, AI processing, automatic analysis, market-data refreshes and specialized operational controls. Community Watchlists do not inherit that runtime or its continuous work.

The Community data path is intentionally bounded:

- every destination, category, permission, post and ticker row is scoped by stable community and destination IDs;
- member pages query only active, published records for the requested destination;
- Alert publication appends one active feed entry;
- Watchlist publication creates or activates a current ticker record, while edit and removal mutate that destination’s current state through short transactions;
- Content publication creates a stable document and revision evidence;
- automatic company data and **Price when added** are captured once at publication rather than polled continuously; and
- no live quote stream, AI worker or per-destination scheduler runs for Community Watchlists.

Database indexes must cover community, destination, status, ticker and publication ordering. Mutations must use small transactions and destination-scoped authorization. Concurrent edits use an explicit revision/version check so an older form cannot silently overwrite a newer change.

Member destinations are read-heavy and should use bounded caching. A publish, edit, removal, permission change or destination-setting change invalidates only the affected destination and its relevant hub indexes. Automatic metadata calls have strict timeouts; failure leaves the authored content publishable and records the automatic fields as unavailable.

Discord delivery remains asynchronous and outside the author’s database transaction. A successful content write is not held open while Discord responds. Delivery attempts retain their existing retry and audit boundaries.

Visit collection must not make destination rendering depend on a large synchronous aggregation. Record bounded events, aggregate older activity into daily page/category/publisher totals, and apply the project’s retention policy to raw events. A visit remains distinct from a like or other engagement signal.

The accepted persistent, single-writer SQLite architecture is appropriate for invited beta while writes remain short and measured contention remains low. No numerical community or visitor capacity is claimed without load evidence. Monitor write latency, busy/lock time, event growth, cache effectiveness, page latency and delivery backlog. Sustained measured contention, rather than an assumed user count, triggers a separate scaling plan for PostgreSQL and queued event processing. The stable IDs and multi-tenant contracts must allow that storage migration without changing public URLs or owner/member workflows.


## Implementation completion checkpoint — 2026-11-04

The Alert, Watchlist and Content architecture in this plan is implemented and technically accepted in the isolated Community preview through registered migration `0199_traderlink_community_destination_templates` at execution order 237. Stable destination behavior, Research/Swing templates, category inheritance and destination restriction, current-state Watchlists, structured Content documents, compatibility routing, bounded caching, concurrency checks and Stats retention all passed their recorded runtime and browser checks. Image processing remains the planned later phase described above. Production release, real Discord delivery and synthetic-account cleanup remain outside this checkpoint.
