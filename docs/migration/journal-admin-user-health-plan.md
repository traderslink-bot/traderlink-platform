# Journal Administration User Health Plan

**Status:** Production correction in progress

**Date:** 2026-08-24

**Release record:** Code release `1664f79497fefe590a52a3bd0030480b97411098`
completed the narrow release chain from hotfix parent
`a40c7db3d70f686772fb49e1bfd61d065c1d7307`. Railway deployment
`a9de6d87-cc33-4d39-9948-b35881d0a47d` applied only
`0084_platform_broker_connection_attempts` through the guarded hosted
backup-and-migration path, then verified
`{ status: "ready", migrationCount: 83, storage: "sqlite_single_node" }`
at `/api/platform/health`.

**Progress tracker:** [Journal Administration User Health Progress](journal-admin-user-health-progress.md)

**Parent plan:** [TraderLink Journal Administration Dashboard Plan](journal-admin-dashboard-plan.md)

**Route boundary:** `/admin/journal/users` and its existing private
`/api/admin/journal/users/**` routes. This is an extension of Journal
Administration, not a second user-management system.

## 1. Outcome

Make the private **Users** area answer one simple question safely and
truthfully: *where is this person in their TradersLink journey, and do they
need help?*

The page must distinguish an Academy member from a dashboard visitor and a
Journal user. It must never treat an enabled account, an empty default Journal
account, a valid browser session, a successful import, and an active broker
connection as interchangeable states.

The completed feature will let the owner see, for each user:

1. whether their Platform account is enabled;
2. whether and when they last signed in to the dashboard;
3. whether they are probably using the dashboard right now;
4. whether they have actually started a Journal;
5. their successful, failed, pending and duplicate import history;
6. their manual-entry count and last Journal activity;
7. known broker-statement sources and verified live broker connections, kept
   deliberately distinct;
8. safe, plain-language explanations for recent failures; and
9. a short, factual list of items that need attention.

It also adds guarded owner controls to disable or re-enable a user and revoke
their active dashboard sessions. Those controls are for account safety and
support. They do not permit impersonation, editing trades, changing Data
Decisions, viewing statements, or deleting a person or their Journal.

## 2. Fixed language and exact definitions

These labels are product decisions. Visible UI must use them exactly unless the
owner later approves a change.

| Visible label | Exact meaning |
| --- | --- |
| **Enabled** | The Platform user record permits future authenticated access. It does not mean the person is online, has opened the dashboard, or has used a Journal. |
| **Disabled** | The Platform user record denies future authenticated access. Existing active sessions are revoked when the owner disables the user. |
| **Last dashboard sign-in** | The latest successful Discord authentication or authenticated Platform-session request. It is not page engagement. |
| **Online now** | A best-effort indication that an unrevoked, unexpired Platform session made an authenticated request in the previous ten minutes. It is never proof that the screen is open or that the person is reading it. |
| **Last seen** | The latest authenticated dashboard request when the person is not Online now. |
| **Last Journal activity** | The latest committed Journal action owned by the user, such as an import, manual execution, rule, tag or note. It excludes a mere sign-in. |
| **Journal started** | At least one accepted manual execution or accepted broker-statement execution exists in one of the user's Journal accounts. A blank default `Primary Journal` does not qualify. |
| **Manual entries** | Distinct accepted manual executions. It does not count a draft, a preview or a broker execution. |
| **Successful import** | An accepted or accepted-with-decisions broker-statement import. |
| **Failed import** | A durably recorded terminal failed or rejected import attempt. A duplicate import and a pending Data Decision remain visible but are not counted as failed imports. |
| **Needs your decision** | A contained Data Decision still needs the trader's factual confirmation. It is not an administrative failure and the owner cannot resolve it for the trader. |
| **Broker statement source** | A confirmed source-account identity or accepted broker statement. This does not claim a continuing broker connection. |
| **Broker connected** | A current provider-backed connection with a fresh, successful verification. A past statement upload alone can never show this label. |
| **Broker connection attempt failed** | A durable, provider-backed connection attempt ended unsuccessfully. A statement-upload error must instead be labeled an import failure. |

### Academy-source rule

The screen may show **Academy progress** from transferred completion records.
It may show **Academy transferred** only when an exact source-transfer record
proves that relationship. It must never guess that an existing Platform user is
an Academy user from a display name, username or email-like value. If no durable
source evidence exists, show **Source not recorded**.

## 3. Current-state correction

The existing table has useful data but presents two misleading labels:

- Its `active` chip is the Platform-user status. It will change to **Enabled**
  or **Disabled**.
- Its **Last active** column currently reads Journal activity, not login or
  current presence. It will change to **Last Journal activity**.

The existing private detail view already has the safe foundation for provider
summary and active-session count. The feature adds the missing user-level
import outcomes, plain-language failure explanations, source/connection status,
Academy progress, sign-in timing and owner controls.

## 4. User experience

### 4.1 Users list

The desktop list has these columns, in this order:

1. **User** — display name and one **Enabled** or **Disabled** chip.
2. **Member journey** — Academy progress when proven, **Journal started** or
   **Not started**.
3. **Last sign-in** — `Online now`, `Last seen`, or `Never signed in`.
4. **Journal activity** — last Journal activity date, or `No Journal activity`.
5. **Imports** — compact outcome summary, for example `3 successful · 1 failed`.
6. **Manual entries** — accepted manual-execution count.
7. **Broker** — plain broker/source status, never an account number.
8. **Needs attention** — at most one highest-priority plain-language badge plus
   a count when additional items exist.
9. **Review details** — the existing privacy-gated action.

On narrow screens, the list becomes stacked user cards. The first visible row
is User, Enabled/Disabled and Needs attention; the remaining facts are inside a
plain **View details** expansion. No horizontal scroll is required to identify
a user who needs help.

### 4.2 Filters and saved operating views

Add bounded filters for:

- Enabled / Disabled;
- Academy progress available / source not recorded;
- Never signed in / signed in during a selected date range / Online now;
- Journal not started / Journal started;
- successful import / failed import / pending decision;
- manual entries present;
- broker connected / broker statement source / no broker evidence; and
- needs attention.

Offer three owner-only saved views with no user-visible effect:

- **New Academy members** — Academy progress exists, no dashboard sign-in;
- **Getting started** — signed in but Journal not started; and
- **Needs attention** — one or more actionable items.

### 4.3 Private user details

The existing audited detail dialog becomes an orderly, privacy-safe view:

1. Account state and member journey.
2. Dashboard access: first sign-in, last sign-in/last seen, Online now state,
   session count and active-session count.
3. Academy: transferred/provenance state, completed-lesson count and latest
   completion date. No lesson content is exposed here.
4. Journal: started/not started, Journal accounts, last activity, successful
   broker imports, failed attempts, manual entries and unresolved Data
   Decisions.
5. Broker: each provider with one of **Connected**, **Statement source**,
   **Connection needs attention**, or **No broker evidence**; include the last
   verified or last attempt time.
6. Recent import attempts: up to five latest entries with date, source type,
   outcome, plain-language reason and a safe next step.
7. Needs attention: all current items, ordered by safety then recency.
8. Account controls: **Disable user**, **Enable user** and **Sign out all
   devices**, each behind its own confirmation.

The dialog continues to require an owner-selected reason and creates an audit
record before disclosing private details.

## 5. Facts, data contracts and new evidence

### 5.1 Reuse existing facts

Use the existing Platform identities, hashed sessions, Journal accounts,
accepted import batches, import attempts, manual execution provenance,
Data Decisions and Academy completion tables. Read models must continue to use
opaque user/account references; browser requests never receive raw UUIDs,
Discord IDs, role IDs, broker account identifiers, tokens or statement data.

Existing facts are sufficient for:

- Enabled/Disabled;
- last successful authentication and session activity;
- active session count;
- Journal activity;
- accepted imports and manual executions;
- import-attempt outcomes and sanitized failure codes;
- unresolved Data Decisions; and
- Academy completion count and latest completion time.

### 5.2 Add exact broker-connection evidence

Do not infer a connected broker from a statement import. Add a Platform-owned,
account-scoped connection projection and append-only connection-attempt history
only for providers that support a real connection.

Each connection projection records only:

- provider key and plain broker label;
- connection state: `connected`, `attention_required`, `disconnected` or
  `not_available`;
- last verified time and last failed-attempt time;
- a bounded, safe reason category; and
- the owning Platform user/workspace/Journal account.

Each connection attempt records a timestamp, provider, attempt channel,
outcome and safe reason category. It never stores a password, OAuth code,
access/refresh token, raw provider payload or broker account number.

Statement upload remains a separate attempt channel. A file that fails to read
appears as an **Import failed** event, never a **Broker connection failed**
event. Provider-specific work remains opt-in and entitlement-safe; this plan
does not add automated broker login, password, CAPTCHA or MFA handling.

### 5.3 Plain-language failure model

Map each retained failure reason server-side to a short explanation and next
step. Examples:

- `This statement format is not supported yet — upload a supported statement or
  ask us to review the format.`
- `The file could not be read — download a fresh statement directly from your
  broker and try again.`
- `This looks like an import already in your Journal — review the existing
  import before trying again.`
- `Your broker connection needs to be refreshed — reconnect it from your
  account.`

An unavailable or unknown reason displays `We could not complete that attempt`
with its date; it never exposes an internal failure code. The owner may see
only the bounded category and safe explanation, not raw logs or source data.

### 5.4 Needs-attention rules

The owner-facing status is derived, never hand-edited. It is present when one
or more of these are true:

1. a failed import attempt occurred in the last 30 days;
2. a broker connection is `attention_required` or `disconnected` after a prior
   connection;
3. one or more Data Decisions remain pending;
4. a user signed in but has not started a Journal after 14 days; or
5. the account is disabled while it still has active sessions (a safety
   invariant that must resolve immediately).

The highest displayed priority is: disabled-session safety, broker connection,
recent import failure, pending Data Decision, then onboarding. The detail view
shows all applicable items.

## 6. Account-safety controls

All controls require the existing Journal-owner authorization, same-origin
request protection, rate limit, explicit typed confirmation and append-only
audit event. Every mutation returns a before/after privacy-safe receipt.

| Control | Effect | Guardrails |
| --- | --- | --- |
| Disable user | Marks the account Disabled and revokes every active Platform session in one transaction. | Cannot disable the current owner-admin or leave the system without an eligible owner-admin. Reason required. No data is deleted. |
| Enable user | Restores authenticated access only. It does not restore a revoked session or alter Journal data. | Requires a reason and a fresh owner confirmation. |
| Sign out all devices | Revokes all active Platform sessions while keeping the account Enabled. | Require confirmation; user signs in through Discord again. |

Out of scope: impersonation, changing a user's Journal, resolving their Data
Decisions, deleting their account, deleting Journal data, exporting raw
statements, changing broker credentials or Discord membership, and any action
based on an unverified display-name match.

## 7. Implementation slices

### User Health 0 — Contract and inventory

- Confirm every existing user-list field against its source and update the
  administration metric definitions.
- Add this plan and progress tracker; update the parent plan and migration
  progress record.
- Inventory provider-specific connection evidence before choosing migrations.
- Do not run a transfer, modify a user, or contact Discord members.

### User Health 1 — Truthful labels and activity read model

- Rename visible `active`/`disabled` user chips to **Enabled**/**Disabled**.
- Replace **Last active** with **Last Journal activity**.
- Add first sign-in, last sign-in/last seen and best-effort Online now facts.
- Add Journal started, manual-entry count, Academy progress and import-outcome
  summaries to the bounded list/detail contracts.
- Preserve every existing opaque-reference, authorization and audit boundary.

### User Health 2 — Import and broker support evidence

- Add user-scoped failed-attempt summaries and the five-item safe recent
  attempt history.
- Implement server-side plain-language failure mappings and next steps.
- Add migration(s), repository and bounded read model for real broker
  connection projection/attempt evidence.
- Integrate only verified provider adapters; use **Not available** when a
  provider does not support a real connection rather than fabricating status.

### User Health 3 — Needs attention and operating views

- Implement the exact derived rules, ordering and filters in this plan.
- Add the three owner-only saved operating views.
- Confirm that Academy users without Journal activity are correctly shown as
  **Not started**, not failed or inactive.

### User Health 4 — Guarded account controls

- Add preview/confirmation/execute routes for Disable, Enable and Sign out all
  devices.
- Enforce transactional session revocation, current-owner protections,
  idempotency, rate limits and append-only audit receipts.
- Add clear post-action UI states with no destructive data controls.

### User Health 5 — Owner review and acceptance

- Review the final desktop and narrow-screen Users page with the owner before
  production activation.
- Verify real Academy-only, signed-in-no-Journal, manual-entry, successful
  broker-import, failed-import, pending-decision, broker-connection and
  disabled-user states using safe test records only.
- Update Help only if a public user-facing account, broker connection or
  recovery flow changes. The private owner UI alone does not require a Help
  Center article.

## 8. Likely implementation surface

The final file inventory will be confirmed in User Health 0. Expected primary
areas are:

- `app/admin/journal/users/page.tsx` and
  `app/admin/journal/users/user-detail-button.tsx`;
- `app/api/admin/journal/users/route.ts` and the audited detail route;
- `src/modules/journal/server/administration/journal-admin-user-service.ts`;
- `src/modules/journal/contracts/journal-administration-contracts.ts`;
- Platform session, broker-connection and administration repositories;
- new forward-only Platform migrations, if the connection-attempt projection
  requires persistence; and
- focused User Administration tests and static admin-inventory checks.

No existing migration is edited. No production data is backfilled from a name,
email-like value or display-name similarity. Any historical Academy origin that
cannot be proven remains `Source not recorded`.

## 9. Verification and release boundary

During implementation, run only focused TypeScript/lint/static checks for the
changed read model or control. Do not run broad suites after individual edits.
At each completed slice, verify the exact privacy, authorization, state and
rendering contracts it changes. Run full build/browser/release gates only at
the final acceptance boundary or when explicitly required for a release.

Acceptance requires proof that:

1. Academy-only users cannot be mislabeled as Journal-active;
2. Enabled, online, signed-in, Journal started and broker connected are all
   independently correct;
3. failures, duplicates and Data Decisions are not conflated;
4. no raw identity, broker, statement, token or trade fact leaks into the list
   or unaudited detail payload;
5. no user can see another user's Journal through the admin read model;
6. disabling a user revokes access without deleting data;
7. signing out devices revokes only that user's active sessions; and
8. desktop and mobile layouts show the important status without misleading
   wording or hidden horizontal columns.

The owner authorized implementation and release on 2026-08-24. Railway work
remains subject to the shared single-writer release coordination in this plan.

## 10. Authorization record

On 2026-08-24, the owner authorized full implementation and release without a
separate visual-review pause. The definitions, layout, derived attention rules
and guardrails in this plan are the approved scope. The linked tracker records
the implementation and release evidence.
