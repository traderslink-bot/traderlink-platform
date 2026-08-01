# TraderLink Migration Phase Handoff Template

**Purpose:** Give the project owner a ready-to-copy optional new-chat prompt whenever a migration phase is completed, and a continuation prompt when a fresh chat is needed before a phase is complete.

## Required handoff record

Before producing the prompt, update the controlling migration documents and record:

- completed or continuing phase number and name;
- owner acceptance status and date, when accepted;
- exact repository path, current branch, HEAD commit, and dirty/untracked state;
- database paths and whether each is read-only, candidate, active, or superseded;
- relevant running processes and ports;
- completed deliverables and verification;
- unresolved facts, risks, and deliberately deferred work;
- exact next authorized phase or continuation scope; and
- actions that remain prohibited without further approval.

Do not claim a phase is complete until its master-plan exit condition is satisfied and the owner explicitly accepts it.

## New-phase prompt

Copy this structure, replace every bracketed field, remove unused lines, and give the completed prompt to the owner:

```text
Continue the TraderLink Platform replacement in:
C:\Users\jerac\Documents\TraderLink\traderslink.pro

Phase [completed number and name] is complete and was explicitly accepted by the project owner on [date]. Begin Phase [next number and name] only.

Before taking action, read completely:
1. AGENTS.md
2. docs/migration/traderlink-platform-replacement-plan.md
3. docs/migration/import-integrity-and-data-decisions-contract.md
4. docs/migration/migration-register.md
5. docs/migration/migration-progress.md
6. [previous phase tracker/handoff and other required documents]

Current verified handoff:
- Repository/branch/commit: [facts]
- Working-tree state: [facts]
- Database state: [facts]
- Process/port state: [facts]
- Completed verification: [facts]
- Accepted owner decisions: [facts]
- Unresolved or deferred items: [facts]

Authorized scope for this chat:
[exact next phase scope]

Do not:
[phase-specific prohibitions, including no implementation/deletion/deployment when not authorized]

First confirm the canonical path, current phase, controlling documents, and exact authorized scope. Maintain the phase tracker as work proceeds. Before closing the phase, update all controlling documents, obtain owner acceptance, and give the owner a ready-to-copy prompt for the next chat.
```

## Mid-phase continuation prompt

Use this form when context is running low or a chat must stop before the phase exit condition is met:

```text
Continue Phase [number and name] of the TraderLink Platform replacement in:
C:\Users\jerac\Documents\TraderLink\traderslink.pro

This is a continuation of the same phase, not authorization for the next phase. Read AGENTS.md and all controlling migration documents before taking action.

Exact resume point:
[last completed deliverable and next action]

Already completed:
[facts with document paths]

Verification completed:
[facts]

Remaining authorized work:
[bounded list]

Unresolved decisions or blockers:
[facts]

Do not repeat completed work, do not broaden the phase, and do not mark the phase complete without satisfying its exit condition and receiving explicit owner acceptance. At the next boundary, update the controlling documents and provide the next handoff prompt.
```

The owner may use the new-phase prompt immediately, keep it as a recovery handoff while continuing in the current chat, or request a fresh chat later. The handoff prompt is a convenience for continuity. The repository documents remain the source of truth when a prompt and the current files disagree.
