# Phase 5 Slice D Journal Annotation Schema

**Status:** Accepted and implemented; empty real schema plus focused persistence/isolation gate passed

**Controlling plan:** [Phase 5 Module Transfer Plan](phase-5-module-transfer-plan.md)

## Ownership decision

Every annotation belongs to the selected TraderLink Journal account. A Journal
account is a trader-defined grouping such as long-term holdings, forex or
small-cap day trading. It is not a broker account. Statements and executions
from multiple brokers and multiple brokerage accounts may coexist inside the
same Journal account. Broker source identities remain provenance only and never
choose annotation ownership.

All commands derive `workspace_id`, `account_id` and author identity on the
server. Browser mutations carry only the opaque expected account-selection
reference and optimistic record revision. A stale selection or revision fails
without writing.

## Immutable migration

Migration `0007_journal_annotations` owns these tables:

1. `journal_rules` - current account-scoped rule identity and lifecycle state.
2. `journal_rule_versions` - immutable rule title, statement, category,
   review scope, focus flag, optional template key/configuration and effective
   time.
3. `journal_rule_lifecycle_events` - immutable activation, pause, resume and
   retirement history.
4. `journal_rule_reviews` - current day- or round-trip-review identity.
5. `journal_rule_review_versions` - immutable review status pinned to an exact
   rule version.
6. `journal_tags` - current account-scoped tag identity, display name and
   active/retired state.
7. `journal_tag_versions` - immutable created, renamed and retired name/state
   history.
8. `journal_round_trip_tag_assignments` - current tag membership for a stable
   round trip.
9. `journal_round_trip_tag_assignment_events` - immutable assign/remove
   history.
10. `journal_daily_notes` - current note identity for a stable
    `journal_trading_days` record.
11. `journal_daily_note_revisions` - immutable five-field Daily Notes content.
12. `journal_round_trip_notes` - current note identity for a stable closed
    round trip.
13. `journal_round_trip_note_revisions` - immutable individual-trade note
    content.

Every table carries composite workspace/account ownership. Foreign keys use
`ON UPDATE RESTRICT ON DELETE RESTRICT`; no authored history cascades away.
UUIDs are lowercase RFC 4122 version 4, timestamps are canonical UTC, dates and
tokens are bounded, and note bodies normalize CRLF to LF without altering the
trader's words.

## Required invariants

- Rule definitions have immutable versions and append-only lifecycle events.
- A review pins the exact immutable rule version that the trader reviewed.
- A review targets exactly one stable trading day or stable round trip.
- Rule review status is `followed`, `broken` or `not_reviewed`; no engine may
  infer the trader's intent or silently author a review.
- Active tag names are unique case-insensitively within one Journal account.
- Rename and retirement append a tag version; physical deletion is forbidden.
- At most ten active tags may be assigned to one round trip. Database triggers
  and the service both enforce the limit.
- Tag assignment changes append immutable events.
- Daily and round-trip notes use optimistic integer revisions and retain every
  prior revision.
- Open-position annotations remain deferred because a closed-round-trip target
  is not an honest substitute for an open-position identity.

## Legacy test-data disposition

The owner confirmed on 2026-08-02 that all legacy tags, tag assignments, old
trade annotations and rules were test data and do not need recovery. The
already verified legacy backups remain preserved but are not migration inputs.
Migration `0007_journal_annotations` therefore creates empty replacement
annotation tables and does not seed or copy any legacy annotation content.

Acceptance is based on fresh factual writes: a newly created tag must remain
attached to the exact stable round trip selected by the trader; a daily note
must remain attached to its exact trading day; and a rule review must remain
pinned to its exact immutable rule version and target. All are isolated by the
selected user-defined Journal account, regardless of how many broker sources
feed that account.

## Acceptance proof

Before the real database is migrated:

- verify migration checksums, schema digest, foreign keys and `quick_check`;
- use one-worker focused tests for account isolation, stale selection, stale
  revision, immutable versions, pinned reviews, tag limits and retained history;
- prove two broker sources can share annotations inside one Journal account;
- prove identical annotation content in two Journal accounts cannot cross-read
  or cross-write;
- prove new tag, daily-note, trade-note and rule-review writes persist to their
  exact account-scoped targets and reject stale revisions/selections;
- prove a round-trip rebuild retains an annotation only through accepted stable
  identity and never guesses across split/merge ambiguity;
- prove the replacement annotation tables initialize empty, with no legacy
  annotation seed or copy;
- verify active Slice D routes and services contain no V3 analytics,
  authentication or persistence imports; and
- emit only privacy-safe counts and digests, never tag names, note/rule text,
  UUIDs, broker identifiers or statement values.

This gate passed on 2026-08-02. A focused disposable test retained a new tag
and both trade-note fields when the same stable round trip advanced from its
first to second calculated version. No split/merge alias was guessed. The
five focused files passed 26 tests with one worker, and read-only verification
confirmed the real database still has 13 empty annotation tables.
