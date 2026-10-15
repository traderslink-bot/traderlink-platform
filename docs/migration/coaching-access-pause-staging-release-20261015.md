# Coaching access-pause staging release

Owner requested staging release and retest in this feature chat after local fix verification. Existing Codespaces AGENTS.md reserves hosted releases for the Coordinator; role assignment is pending. The earlier no-role-change/no-Bullrun-change boundaries continue. No publication, deployment or Coordinator message has been sent.

## Exact candidate and live baseline

- Clean local candidate: `/workspaces/traderlink-coaching-access-pause`, branch `codex/coaching-access-pause-20261015`.
- Verified fix: `28c127f6d1fd6f84eea16ca2e49c31175ce44adb`.
- Exact parent / current remote `staging`: `3dfe06ddb2584eaaf00e3fde609d63b13daf124d`; candidate is one commit ahead, zero behind. No upstream configured for this local branch.
- Current remote `main`: `78bf4421b815e079a31b1135d771572a0e979a13`; excluded from this release.
- Live read-only Railway check still reports successful deployment `b0d0f728-45b3-4808-8cb9-2d5e4902404a` on the parent SHA and branch `staging`, with no newer pending deployment among the latest four.
- Staging health: HTTP200, ready, sqlite_single_node, 160 migrations.
- Target project `49fc9197-07c9-45c7-b528-57d0393c2cca`, environment `9e079dd4-f3f3-4872-9b00-adbd3000c485`, service `4d264aca-510c-4f5e-bc28-e89e526b8008`.
- Prior Coordinator record says its staging slot was handed back after completion. Recheck all live owners/config/instance/volume before claiming a new slot. Production remains on main; staging's explicitly approved branch exception stays staging. Do not change either source branch.

## Candidate allowlist

- `app/(dashboard)/communities/coaching-agreement-panel.tsx`
- `app/(dashboard)/communities/student-coaching-workspace.tsx`
- `docs/migration/coaching-feature-findings-2026-10-14.md`
- `docs/migration/traderlink-communities-coaching-launch-progress.md`
- `src/docs/codex-project-log.md`
- `src/modules/communities/contracts/coaching-access.ts`
- `src/modules/communities/contracts/traderlink-community-platform-contracts.ts`
- `src/modules/communities/server/coaching-access-lifecycle.ts`
- `src/modules/communities/server/traderlink-community-platform-repository.ts`
- `src/scripts/verify-coaching-remediation.ts`

## Checks and execution boundary

Existing focused real-schema remediation, student selector regression, targeted TypeScript and ESLint passed for this exact candidate. No schema, SQL, migration, auth, dependency or Railway configuration changes. [Evidence and root cause](coaching-feature-findings-2026-10-14.md).

Coordinator must obtain full-build proof for the exact runtime tree before publication, preserve all other worktrees and dirty source, verify remote staging parent has not moved, and fast-forward staging only after claiming the release slot. No raw directory deploy, no production/main publication, no variables/role/channel/grant mutations. Prior schema-compatible successful image/deployment remains the recovery reference. Verify the release deployment ID/source SHA, one writer, original volume, zero overlap, configured drain and health before handing back the slot.

Hosted retest: signed-out routes still require Discord login; signed-in target relationship remains access-paused for its verified absent required role and shows actionable server-owner/admin guidance. Existing legacy notices display a neutral heading; future role denial notices explain the actual reason. Verify participant-only data and disabled new-work actions; delivered history remains readable. Do not assign a role, force active state, accept an agreement, create a Journal grant or modify Bullrun to complete this retest. Restoration is locally tested; a real hosted restoration test needs separate authorization for the underlying role/policy action.

No signed-in browser connection to the owner's PC is available in this Codespace. If that remains the case after release, use the PC Codex's existing signed-in staging browsers for the participant view checks; do not create forged sessions, request cookies, or bypass authentication. Keep deployment health/code proof separate from signed-in browser acceptance.
