# Trader Intelligence v3 GA0-A2 final correction scope

Date: 2026-07-18 America/Toronto

## Purpose

This file defines the single remaining GA0-A2 correction after independent re-audit of executable head:

`c1a1b50379165485d28f0e0a28a21c3917cac820`

The independent verdict was:

`accept with one required fix`

PR #104 must remain draft, open, unmerged, and undeployed. GA0-A3 must not begin.

## Remaining defect

Correction and bust pair identity is still scoped too broadly.

The current implementation can treat two executions as related when they share:

- broker code;
- source system;
- canonical account key;
- execution ID or correction reference;

but differ in:

- canonical owner;
- stable instrument;
- currency.

This can cause one corrected execution to contaminate and block an unrelated ticker or currency ledger when execution IDs or correction references are reused across instruments.

## Required implementation changes

Update these files only as needed:

- `src/lib/trader-intelligence-v3/domain/execution/execution-relationship.ts`
- `src/lib/trader-intelligence-v3/domain/execution/execution-relationship-resolution.ts`
- documentation files that accurately record the change

### Stable execution scope

Stable execution identity must require compatible ledger identity in addition to broker/account/source identity.

At minimum, require equality of:

- canonical owner key;
- canonical account key;
- stable instrument key;
- currency;
- broker code;
- source system;
- non-null execution ID.

If either stable instrument key is unresolved or null, do not use stable execution identity to create a correction pair across groups. Keep the relationship conservative and fail closed only for the affected unresolved group.

### Correction-reference pair scope

A correction or bust reference may link two executions only when they also share compatible ledger identity:

- canonical owner;
- canonical account;
- stable instrument;
- currency;
- broker;
- source system.

Matching text alone is not enough.

### Candidate indexes

Update the relationship candidate indexes so these indexes include ledger identity:

- `stable_execution_identity`;
- `correction_reference_identity`.

The indexed key must include:

- canonical owner key;
- canonical account key;
- stable instrument key;
- currency;
- broker code;
- source system;
- execution ID or correction reference.

This prevents unrelated instruments and currencies from becoming candidate correction pairs.

### Required behavior

- A correction in instrument A must block only instrument A.
- A correction in USD must not block an unrelated CAD ledger.
- Reused execution IDs across symbols must remain distinct.
- Reused correction-reference text across symbols must remain distinct.
- A valid original/correction pair in the same ledger identity must still classify as `broker_correction_or_bust`.
- Intrinsic unresolved correction state must continue to block its own group.
- No previously accepted GA0-A2 safeguard may be weakened.

## Scope restrictions

Do not change:

- exact decimal behavior;
- canonical serialization;
- FIFO calculations;
- starting-inventory policy;
- ordering receipts;
- relationship performance architecture except for the index-key scope above;
- routes, pages, UI, AI, charts, analytics, market data, support/resistance, migrations, hosting, or deployment.

Do not begin GA0-A3.

## Testing policy

The owner explicitly requested no local testing for this correction.

Do not run:

- Vitest;
- `npm test`;
- property tests;
- differential tests;
- TypeScript checks;
- ESLint;
- architecture verification;
- private-data verification;
- Layer 2 or Layer 3 verification;
- build;
- Playwright.

Do not wait for or manually rerun GitHub Actions.

Because no tests are being run, do not claim the correction is verified, accepted, or regression-safe. State clearly that it is an unverified implementation candidate awaiting independent code review and any later testing decision.

## Git and PR completion

- Work on existing branch `agent/trader-intelligence-v3-ga0-a2-exact-truth`.
- Do not create another branch.
- Commit the focused correction intentionally.
- Push the same branch.
- Keep PR #104 draft and unmerged.
- Do not resolve existing independent review threads.
- Add a concise PR comment mapping the changed functions and explaining that no local tests were run at the owner's direction.
- Update the handoff/report only if necessary, clearly recording that the implementation is untested.
- Stop for independent re-audit.
