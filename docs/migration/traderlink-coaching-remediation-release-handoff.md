# Coaching remediation staging handoff

Status: source candidate; staging deployment and whole-feature browser acceptance pending.

Controlling progress: [six-area remediation](traderlink-coaching-qa-remediation-progress.md).
Full acceptance inventory: [13-area QA](traderlink-coaching-full-qa-20260927.md).

## Integration boundary

- Assigned source lane: `coaching-resume-20260926`, parent
  `3bf6ae9dadc553e5519f6fd96341733dcc4350bd`.
- Coordinator owns integration, migration rehearsal and the sole Railway writer.
- Staging must include latest production plus all previously staged coaching work.
  Coordinator last reported production `a741710f53503339b7df1882b472b00f8c0f56cb`;
  recheck live parent before packaging, do not assume that remains current.
- Preserve owner review `aa1785a7-9b20-44cf-b2df-7cd2bb5c250f` and QA draft
  `69865ebd-fc79-4daa-9d28-e99d405ba752`, existing identities and Journal records.
- The immutable commit's changed-file list is the exact allowlist. No production
  feature publication, provider credentials, new users or grants are authorized here.

## Migration contract

Portable migration `0145_traderlink_communities_coaching_delivery_workflow`, order145.
Coordinator reserved staging compatibility158. Applied0144 is unchanged. Compatibility
translation belongs to the staging release integration, not this portable migration.

Exact SQL is the migration's frozen `statements` array; manifest adds its identity
and these four managed tables:

- `traderlink_community_coaching_agreements`
- `traderlink_community_coaching_occurrences`
- `traderlink_community_coaching_access_state`
- `traderlink_community_coaching_notices`

Old rows retain all previous fields. Additive defaults:

| Existing records | New values |
| --- | --- |
| Plans | revision1; builder configuration `{}` |
| Relationships | archive timestamp NULL |
| Sessions | duration NULL; meeting/private notes empty; attendance not recorded |
| Teaching | delivery live; recording empty; availability/due NULL |

New tables start empty. No old agreement, schedule, payment or role verification is
invented. Existing lessons are not retroactively classified as recorded. Existing
relationship toggles and draft/privacy behavior remain authoritative for legacy work.

Before applying: save a verified staging backup, rehearse against a disposable copy,
verify registry/manifest/schema and old-row counts, then apply only under the
Coordinator's single-writer boundary. No source agent has applied this to hosted data.

Rollback is NOT blindly restarting an old manifest against the upgraded database.
Prefer an exact schema-compatible forward application repair. A database restore is
a separately coordinated offline recovery that must account for post-upgrade writes;
never erase new coaching activity or restore a production volume for this feature.

## Recurring operation and external blockers

`GET /api/cron/coaching-maintenance` requires timing-safe Bearer `CRON_SECRET`.
It refreshes at most25 Discord students, schedules at most25 agreements /120 items per
agreement, and archives only confirmed paused relationships at their agreed interval.
Repeated occurrence generation is idempotent; unscheduled custom coaching stays unscheduled.
Coach can also explicitly schedule accepted work through the agreement card.

The refresh reader uses `TRADERLINK_DISCORD_BOT_TOKEN` with the Discord guild member
endpoint. A confirmed missing member removes the cached roles; permission failures,
rate limits and network failures do not manufacture role removal or paid status.
No endpoint itself proves a recurring job is configured.

Coordinator's read-only staging inspection found existing CRON_SECRET, no coaching
bot token, and no dedicated coaching scheduler. Do not repurpose the live Watchlist
runtime or Nasdaq relay. The synthetic student has no OAuth identity/session. Real
student login, live role changes and recurring operation remain acceptance blockers
until an owner-approved identity/configuration path exists.

## Verification evidence

- Bounded semantic TypeScript check:31 changed files, zero diagnostics at checkpoint.
- Targeted ESLint:31 changed files, zero errors/warnings at checkpoint (dependency
  discovery emits its fallback React-version notice because this lane has no install).
- In-memory SQLite service checks: frozen agreements, student-only acceptance,
  weekly/month-end/custom coverage, idempotence, bounded150-session generation,
  stale plan edits, question renewal, follow-up expiry, draft/private-note privacy,
  image isolation, account grant/revocation boundaries, sessions and lesson reuse,
  mocked role loss/restore/provider failure, archive preservation and foreign keys.
- No Vitest, full local production build, real Discord request or hosted mutation.
- These checks are not authenticated browser QA. Repeat the complete13-area inventory
  after deployment, keeping unavailable scenarios clearly marked unverified.

## Skill and Help review

Next.js guidance informed server-action authorization and serializable client data;
React guidance informed stable dates, controlled state and dependency checks. Existing
Help payment/privacy/Discord-role statements remain valid. New instructional prose
is not published without the owner's exact-wording approval.
