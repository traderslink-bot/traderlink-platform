# Watchlist analysis quality closeout

Status: not release-ready. This is the controlling remaining-work checklist,
not a replacement for the approved [plan](watchlist-analysis-quality-plan.md).
The [acceptance inventory](watchlist-analysis-quality-acceptance-checkpoint.md)
retains the complete scope; the long progress log is chronological evidence.

## Current local boundary

- Runtime source: `b71ff214ab38daa0f967232c9aab49dd975786e7`.
- Platform source before this record: `d5c088f9a24be20964a58d6111fba85637230554`.
- Neither SHA is a deployment claim. No coordinator handoff has been sent.
- Platform still contains separate notice/name/layout edits in the Watchlist
  client/CSS and related documents. Preserve and identify them in the manifest;
  do not silently include them in this analysis release.
- Fresh checkpoint: 20 owner-edit/review-store/publication-preview Node tests
  pass with one worker. This verifies edits, original/revised storage, stale
  revisions, pinned previews and delivery receipt behavior at those boundaries.
  It is not full UI or real Discord acceptance.

## Required closeout work

| Group | Concrete exit evidence still required |
| --- | --- |
| Analysis quality | Match the plan's named fixture cases to existing tests; add only missing cases. Verify meaningful shallow/deep structure, failure/base relationship, complete retained branch dependencies, malformed/refusal/truncated outputs and one-call outcomes. Historical FTFT/TNON/AEON excerpts remain explicitly partial, never reconstructed full packets. |
| Approval and delivery | Verify one integrated initial private admission and replacement approval path with exact edited output, failed delivery/retry and removal/re-add. Reuse the existing session/OFF/race tests; do not rewrite already passing settings/review logic. Confirm manual refresh and live-data updates do not bypass approval or add automatic calls while OFF. |
| Audit visibility | Verify actual operations detail rendering exposes original/input/response/edits/outcomes and all recorded requests. Confirm unavailable captures are explicit, retained revisions remain accessible, and history retrieval does not silently omit relevant records. Recent count, inactive-history and interruption fixes need integrated UI proof. |
| Member and recap compatibility | Verify complete member rendering with retained/omitted scenarios and older payloads; identify any remaining mixed UI changes. Trace the actual recap consumer and verify shallow/deep/recovery/omitted inputs preserve owner-edit freedom. Keep recap implementation a separately identified allowlist. |
| Release package | Produce reconciled runtime/Platform file manifests, exact parents, local checks and remaining risk list. Prepare the cutover backup/rollback/client-routing inventory without changing hosted state. Do not send the handoff until instructed. |

These are verification gaps, not a claim that five new features need building.
When a check fails, record the concrete defect and repair that defect. When a
requirement passes, close it rather than adding speculative acceptance scope.

## Separate authority gates

- Actual desktop/mobile rendering and live initial/replacement publication
  require the authorized hosted environment; no local preview is permitted.
- Real model-quality checks, provider/Discord receipt checks, runtime cutover,
  settings changes and deployment require separate owner authorization after
  the relevant trading sessions, with the release-owner boundary respected.
- Preparing these gates is part of this task. Executing them is not authorized
  merely because local work is complete or the market has closed.

## Not grounds for expanding this release

Do not add new providers, generalized scheduler redesigns, unrelated UI polish,
new analytics, or speculative defensive frameworks. Extensive load benchmarks
are not a new feature requirement; investigate performance only where current
code or a bounded check demonstrates an issue with the approved workflow.
Do not defer an explicit plan requirement by calling it optional.

## Next action

Finish the fixture-to-requirement mapping and integrated approval/delivery check
before another cosmetic or speculative refinement. Record each exit in this
file and the acceptance inventory; do not substitute repeated small success
messages for a release-readiness decision.
