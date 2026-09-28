# Membership access entrypoint audit

Status: source reconciliation complete for the 15 built-in feature definitions;
signed-member and populated offline checkpoint complete. This is supporting evidence for
the [acceptance matrix](membership-acceptance-matrix.md), not a replacement for it.

## Controlling feature inventory

| Feature | Active enforcement boundary | Evidence boundary |
| --- | --- | --- |
| Dashboard | Platform request identity requires the configured Dashboard policy; billing identity does not require a paid dashboard or guild | Signed-session fixture covers access, revocation and retained billing |
| Journal | Workspace, Calendar, trackers, Open Positions, Candle Review, Trading Rules, Rule Results and Data Decisions page/API boundaries; note/tag/rule-review mutations | Actual denied-handler fixtures plus source tracing; signed-member populated Workspace and offline reload passed |
| Journal accounts | Account creation checks the effective numeric limit; demo accounts excluded from usage | Disposable limit fixture; existing accounts are not deleted |
| Broker statement imports | Preview, commit, repair, Moomoo start/history/latest, queue selection, scheduler and worker | Signed request, zero-write denied commands and queue fixtures; no real broker request |
| Manual trade entry | Manual preview/commit/execution routes and AI manual-entry draft commit/preview | Request and draft fixtures; existing saved records remain |
| Analytics | Analytics pages/services, overview and analyzed-trade/candle-pattern APIs; Workspace metrics checked separately from Journal review summary | Signed denied-handler/either-feature fixtures, rendered denial redirect and populated Workspace grant/revoke checks passed |
| Trade Explorer | Explorer pages, saved-view/comparison actions and service reads; review load/save/tag actions | Source reconciliation and focused compilation; not an individual browser exercise of every action |
| Reports and exports | Trade Explorer PDF route checks export access before generating a report; underlying Explorer service checks still apply | Source/compilation; no new export implementation implied |
| AI Reviews | Paid-access policy used by generation coordinator and issuance; membership grants can supply access alongside preserved billing integration | Disposable policy/issuance evidence; no live AI generation |
| AI Chat | Generation runtime before provider work; draft side-effect services retain their own permissions | Disposable draft/request evidence; saved history/privacy controls not blanket-gated |
| Academy | Public lesson/page visibility adapter and progress completion authorization | Disposable Academy fixture; saved progress preserved |
| Watchlist | Standalone request authorization uses stable signed identity plus Watchlist policy, without requiring a paid dashboard or guild | Actual authorization adapter fixture |
| Community | Community repository capabilities plus separate Community Watchlists pages and create/edit/follow writes | Disposable capability and watchlist grant/revoke/ownership fixture; stopping a follow remains permitted |
| Coaching | Student relationship admission, active relationship checks, teaching audience and coach Journal read service | Existing relationship/consent/role checks remain; disposable coaching fixture; no actual coaching session claimed |
| Broker connections | Moomoo connection admission checks effective numeric limit, including reconnect behavior | Disposable foundation coverage; existing revoke/management controls preserved |

Custom feature registration extends this registry without a fixed plan count or
hard-coded tier hierarchy. A future feature needs its code connected to the
registered key; a registry entry alone cannot intercept arbitrary application code.

## Shared and intentionally ungated surfaces

- Single-trade details, saved analysis and factual reflection summaries accept
  either Journal or Analytics where they serve both. One permitted feature is
  sufficient; this does not expose another account or user's records.
- Imports and Quick Trade Entry pages render controls/account context. Their
  data/mutation endpoints enforce the relevant import or entry policy.
- Account/profile/privacy, connection management, notification preferences,
  stored AI history and rejection/privacy controls are not blanket commercial
  gates. Authentication, account ownership and existing capability checks remain.
- Level Analysis, news, market halts and readiness do not have dedicated built-in
  membership keys. Do not invent commercial restrictions on them. They retain
  their existing authentication/authorization and provider controls.
- PWA scope/projection-context endpoints return opaque partition/context data,
  not trading facts. Page/service checks govern newly rendered facts. Previously
  stored offline data is not remotely erased by a plan change.
- Workspace's Journal review summary is distinct from its Analytics metrics.
  Denied Analytics produces no metrics in the new offline model. The final
  populated browser/IndexedDB and network-disabled reload checkpoint confirms it.

## Final acceptance boundary

1. Normal signed-member Workspace access/revocation and retained billing passed.
   The harness omits Railway startup workers, not authentication or policy checks.
2. Populated Workspace and offline capture/reload passed with Journal-only access.
   The empty-metric validator defect was corrected and regression-covered.
3. Actual Discord callback refresh passed with mocked responses. Real external
   account acceptance is not claimed. Payment-provider acceptance is explicitly
   deferred to the owner's separate final goal.
4. Selected-route compile/generate and 115-entrypoint focused compiler passed.
   This is not a full-repository build or hosted release acceptance.

See the [final checkpoint](membership-local-acceptance-checkpoint.md) for exact
evidence, corrections, cleanup and external boundaries.
