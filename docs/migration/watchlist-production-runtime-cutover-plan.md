# Watchlist Production Runtime Cutover Plan

Status: Proposed operational plan; no infrastructure changes authorized.

Related: [Analysis Quality Plan](watchlist-analysis-quality-plan.md).
Progress: [Analysis Quality Progress](watchlist-analysis-quality-progress.md).

## Historical inspected topology — September 10, 2026

These are the earlier inspection results, not a current deployment-status claim.
Recheck service identities, routing, revisions and volume ownership read-only
before choosing or executing the production change. Do not infer configuration
from the environment name alone.

- Production Dashboard's running configuration points to the staging runtime
  public endpoint, with runtime authentication configured.
- Staging Dashboard points to that same runtime through its private endpoint.
- That runtime is in Railway's staging environment and its configured ingest
  destination is the live public site. Today's live Admin attempts match its
  durable ledger. The historical reason for this topology remains unverified.
- Treat this service and its volume as production-critical, not a test fixture.

## Target

One production-owned publisher/runtime and durable state, connected to
production Dashboard and production ingest. Staging must have an isolated
runtime/data/credentials and test destinations, or its runtime controls must
be disconnected until isolation is available. No shared live mutation path.
Renaming a staging service alone does not establish this isolation.

## Prepare without changing hosted state

Preparation is not complete. No execution window, production source parent,
final file allowlist, guarded backup manifest or live rollback rehearsal has
been accepted. The linked acceptance inventory still contains implementation
gaps, including final omission outcomes and cross-section validation. Resolve
those gaps before representing the feature package as ready for production.

1. Record current project/environment/service/deployment identities and exact
   source revisions; verify the live ingest routing through the public site.
   Inventory Dashboard admin, public ingestion, Discord, Moomoo/provider access,
   news lookup, recap receipts and any external runtime clients.
2. Inventory durable state, request history, cost/settings, outbox, delivery
   dedupe/lifecycle records and receipts, including relevant files outside the
   volume. Identify mounts, permissions, backup/restore method and disk bounds.
3. Specify exact production service configuration and isolated staging policy.
   Transfer secrets securely, never through project documents or chat. Confirm
   provider sessions/network restrictions and Discord duplicate-prevention.
4. Choose an owner-approved quiet window after market close. Extended-hours
   AI/publishing is enabled, so explicitly agree the pause window and pending
   work disposition. Confirm no other Railway release is active.
5. Prepare rollback using the existing source revision, prior configuration and
   preserved source volume. Do not combine infrastructure migration with the
   new analysis behavior's first release.

## After-hours execution — explicit owner approval required

1. Freeze owner mutation entry points for the cutover window and drain existing
   generation/publication work; record pending/uncertain requests. Do not retry
   ambiguous AI or Discord outcomes automatically.
2. Quiesce the old publisher with a verified stop, then take the final consistent
   state backup, manifest/hash check and restore copy. Keep originals intact.
3. Restore to the production-owned runtime with publishing/generation initially
   disabled. Verify identity, state counts, settings, histories and readiness.
4. Disconnect staging's live control path and point production clients at the
   new authenticated runtime. Verify ordinary-user denial and owner access.
5. Confirm the old writer is stopped before enabling the new writer. Never run
   two active Discord/website publishers or two writers against one volume.
6. Verify health, source revision, volume persistence, provider connectivity,
   news lookup, website ingestion and owner controls. A real AI call or Discord
   test post needs explicit approval; use a private test destination if approved.
7. Check that staging cannot mutate live state or deliver to live channels.
   Record cutover outcome and retain old service/volume for rollback; do not
   delete them as part of this plan.

## Rollback

If readiness, access, state integrity or publication verification fails, stop
the new writer first. If it has performed any writes or deliveries, reconcile
new state, acknowledgments and dedupe records before restoring the old writer;
never blindly restore an earlier snapshot and replay already-delivered work.
Restore production client routing and resume only the verified single old
writer. Keep staging disconnected from live controls. Report the exact failure
and rollback outcome; do not repeatedly redeploy as a diagnostic technique.

## Acceptance and sequencing

Production runtime ownership, preserved data, single publisher, isolated staging,
working owner controls and verified ingest are all required. Then release the
separately tested analysis changes in an explicitly approved window. The owner
does not need to operate worktrees or run tests. No automatic scheduled release,
new service, variable change, stop/restart, migration or deployment follows from
approval to prepare this plan alone.
