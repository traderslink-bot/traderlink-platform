# Premium swing plan authoring: release handoff

## Scope and parent

Owner approved the separate authoring feature. It does not change Watchlist Swings,
the Swing Tracker, Trade Analyzer or the publisher runtime. Journal Admin navigation
is owner-only. Members receive direct idea links from Discord, with existing Premium
authorization; no member navigation or catalogue is added.

Coordinator-confirmed production/remote parent: `63290941b32b7b41f332c7ed83cc91ff43633146`.
Source branch: `main`. Current production deployment reported by coordinator:
`6178968b-8d69-403e-8eee-345a35b57b94`, SUCCESS, one RUNNING instance.
This is parent evidence, not deployment evidence for this new feature.

The exact allowlist is exported by `src/scripts/premium-swing-plan-candidate.cjs`.
It creates an in-memory overlay on that parent. Shared manifest, administration
navigation, migration register and original plan receive only explicit additive
changes on the parent, not whole-file copies from this historical mixed checkout.
The checkpoint helper creates only a local immutable commit/reference, with a
temporary Git index; it leaves HEAD and the ordinary index untouched and never pushes.

## Implemented slice

- Owner plan list/new/edit, including explicit import of the original CRML idea into
  an editable draft. Its old static page remains unchanged until explicit publication;
  both existing URL aliases and historical visit identity remain intact.
- Finnhub company profile review before replacement; owner fields, thesis, research,
  entry/exit plan, key levels, risks, custom sections and rich text/images.
- Draft save/save-and-close, close/discard warning, navigation warning, same-renderer
  Premium preview, locked preview, immutable saved versions and separate publication.
- Dated updates, close/reopen and optional closing summary. Empty/hidden sections
  and empty updates are omitted. Owner words are not rewritten by AI.
- Explicit separate Premium and Free Discord previews/sends, saved comment defaults,
  generic editable public embeds, channel receipts, frozen retries, duplicate-send
  protection and owner resolution for uncertain delivery after checking Discord.
- Multi-idea visit filters preserve original records. The client sends the displayed
  publication revision, validated against saved publications, rather than silently
  attributing an old open page to a newly published version.
- Owner-only inline Help explains these workflows; no public Help/navigation link
  reveals or advertises an unpublished idea.

## Migration

Reserved: `0154_platform_premium_swing_plan_authorship`.
Exact predecessor: `0153_platform_watchlist_category_move_notifications`.
Checksum: `e1452f960ea932f08f69cbe543703f69a84b66dd09c1690258fee47074d3d7d9`.

Four new tables: `platform_swing_plans`, `platform_swing_plan_versions`,
`platform_swing_plan_publications`, `platform_swing_plan_deliveries`.
No existing tables are altered and no content or visits are migrated/deleted.
Migration 0139 remains unchanged. No runtime DDL. This migration is unapplied.
Use the coordinator's guarded backup/predecessor/single-writer procedure; do not
boot the new manifest against a database still missing 0154. Preserve backups and
do not drop new authoring data to roll back application code.

## Verification completed locally

- `node --max-old-space-size=256 src/scripts/check-swing-plan-authorship.cjs`
  passed isolated SQLite draft/publication isolation, version/visit preservation,
  safe URLs, public ticker rejection, short-symbol wording, foreign-key integrity.
- `node --max-old-space-size=256 src/scripts/check-swing-plan-delivery.cjs`
  passed mocked Premium/Free separation, success deduplication, failed retry,
  uncertain delivery resolution, no transaction over network await, bounded input,
  and original wording/format conversion. All credentials/transports were fake.
- `node --max-old-space-size=256 src/scripts/check-swing-plan-page.cjs`
  passed isolated server-rendered locked/Premium content, generic metadata, no
  private read for locked viewers, unpublished edit isolation and blank omission.
  Identity and frame were mocked: this does not prove hosted authentication.
- `node --max-old-space-size=640 src/scripts/typecheck-swing-plan-authorship.cjs`
  passed focused strict TypeScript on the exact parent overlay for the new contract,
  store, editor/rendering components, posting APIs and visit API/recorder.
- Wider checking through the full dashboard frame exceeded the 640 MB local cap.
  It was stopped; no larger-memory retry or local production server/build was used.
  The release build is still required and not claimed to pass.

## Remaining hosted gates

1. Coordinator reconciles the exact candidate with then-current `main`; confirm no
   concurrent release, allowlist, guarded migration and normal build/health checks.
2. Owner confirms destinations. Separate variables are
   `SWING_PLANS_PREMIUM_DISCORD_WEBHOOK_URL` and
   `SWING_PLANS_FREE_DISCORD_WEBHOOK_URL`. No existing Watchlist webhook is assumed
   or changed. Missing configuration shows a clear notice and sends nothing.
3. Hosted owner desktop/mobile/light/dark editor and actual locked/member page
   acceptance; test anonymous, signed-in Free and Premium, owner-only APIs/nav,
   page/RSC/cache behavior and original short/legacy aliases.
4. Owner-approved test plan: save without affecting the live version, publish, edit,
   update, close/reopen, inspect visits, and independently send/confirm each configured
   channel's exact message and generic embed. No automatic replay or bulk sends.

No real provider request, real Discord send, migration application, push or deployment
has been performed by the implementation checks. The overall goal remains open until
the release and acceptance gates have actual evidence.
