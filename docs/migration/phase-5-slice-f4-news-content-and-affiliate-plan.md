# Phase 5 Slice F4 - News Content And Affiliate Ownership

**Status:** Technically complete under the owner's delegated technical
authority on 2026-08-02. This document is the controlling Slice F4 contract;
hosted adoption and focused Vitest execution remain Phase 6 gates.

## Outcome

Slice F4 gives News and affiliate attribution explicit module ownership without
reintroducing the old mixed `trader-intelligence.sqlite` database as a runtime
fallback.

- News is public TradersLink content. It is not owned by a Journal account.
- Affiliate invites and user attribution belong to Platform commerce/account
  relationships. They are not trading facts and are not Journal-account scoped.
- Big Time Pennies remains preserved low-priority static content and automation.
  It is not moved into the Journal database and is not run in this slice.
- The legacy mixed local database remains a read-only migration source until its
  one News article is backed up, restored, copied, and reconciled.
- No legacy trade, saved-trade, rule, tag, note, or review test record is part of
  this slice or required for recovery. Future Journal annotations remain bound
  to their Platform user, selected user-defined Journal account, stable round
  trip and/or trading day under Slice D.

## Verified entry evidence

The legacy mixed database is:

`C:\Users\jerac\Documents\TraderLink\traderslink.pro\data\trader-intelligence.sqlite`

Read-only inspection on 2026-08-02 found:

- size `348,160` bytes;
- SHA-256
  `ae976482866435799bf06a1dec8188d0e3b4f3fb8d7565b93cfafa523e1c4f37`;
- `PRAGMA quick_check = ok`;
- one `news_articles` row;
- no `affiliate_invites` or affiliate-referral table;
- all legacy trading/domain tables in this mixed file contain zero rows except
  `schema_migrations` and the single News row.

The single News row was inventoried by per-field presence, length and SHA-256
without printing its content, identifiers or source evidence. Its old schema
does not contain `canonical_source_key`; the import derives that value only when
a non-empty source URL exists. The observed row has no source URL, so its
canonical source key remains null.

## News ownership contract

### Storage

Migration `0015_news_content` creates News-owned storage:

- `news_articles` is the current public read projection;
- `news_article_versions` is immutable revision evidence;
- current rows carry a monotonic revision and deterministic content SHA-256;
- `(ticker, slug)`, non-null source event IDs and non-null canonical source keys
  remain unique;
- JSON fields must contain valid JSON;
- version rows cannot be updated or deleted.

The legacy row is copied only after an online backup and independent restored
copy both pass hash, schema, count and integrity reconciliation. The copy keeps
the original article ID, slug, timestamps and content fields losslessly, adds
revision `1`, and records one matching immutable version. A second run must be
idempotent and must not create another article or version.

### Runtime selection

- Local development uses the protected replacement Platform database selected
  by `TRADERLINK_PLATFORM_DB_PATH`.
- Test-only isolated SQLite paths remain possible only through an explicit test
  configuration; no repository-local database is created automatically.
- Hosted News uses only the named `NEWS_DATABASE_URL`.
- `ACADEMY_DATABASE_URL`, `DATABASE_URL`, `POSTGRES_URL`, Neon aliases,
  `TRADER_INTELLIGENCE_DB_PATH` and repository `data/` paths are not fallbacks.
- Production rejects SQLite and rejects a missing named hosted News database.
- Ordinary requests verify the expected hosted schema; they do not create,
  alter, repair, backfill or adopt schema.

### Publishing and reads

- Public News pages remain server-side direct reads and preserve existing URLs.
- Publisher mutations require an exact configured `NEWS_PUBLISH_TOKEN` in every
  environment. A missing token is a configuration failure, never local bypass.
- Token comparison is timing-safe and publisher errors do not echo secrets or
  private payloads.
- The publish response returns public article identity/path information, not
  diagnostics or raw publisher payloads.
- Source canonicalization keeps one article per source and never lets a
  lower-priority market-cap copy remove higher-priority paid-feed levels.
- A content-changing upsert creates one new immutable version; an identical
  retry returns the current row without creating a duplicate version.

### Academy progress on News pages

The article page uses the accepted Academy access boundary:

- guarded local review resolves the stable Platform user and replacement
  Academy progress;
- hosted runtime temporarily uses the existing Discord compatibility session;
- direct `AcademyProgressStore` access is removed from the News page;
- exact Discord-to-Platform identity activation remains Slice F6.

## Affiliate ownership contract

Migration `0016_affiliate_attribution` creates:

- `affiliate_invites`, owned by Affiliate/commerce configuration;
- `affiliate_attributions`, keyed by stable `platform_users.user_id`.

An attribution records the affiliate code, optional invite code, source,
first/last-seen timestamps, optional joined timestamp and sanitized metadata.
It never stores a Journal account ID and never infers a relationship from broker
data. The first accepted affiliate attribution remains authoritative; repeated
events may advance `last_seen_at_utc` but cannot silently replace the original
affiliate.

The local replacement starts with zero affiliate rows because the verified
legacy local source has none. Existing hosted Discord referral relationships
must be backed up and mapped through `platform_auth_identities` during F6. No raw
Discord subject is copied into `affiliate_attributions`.

The filtered-news access page uses a Platform-owned resolver:

- guarded local review resolves the stable development Platform user without a
  Discord login;
- hosted runtime temporarily reads the legacy Discord referral source through
  an explicitly named compatibility adapter;
- after F6 adoption, hosted reads resolve the authenticated Platform user and
  `affiliate_attributions` directly.

## Big Time and other content

`src/content/big-time-pennies/articles.json`, the Week Ahead pages and
`tools/big-time-pennies` remain preserved. They are file-backed publishing
content/automation, have no Journal dependency and are not executed or migrated
to SQL in F4. Existing text-encoding defects are recorded for a later content
quality pass; F4 does not rewrite article copy without editorial review.

## Verification gate

Focused Slice F4 verification requires:

1. migration manifest/checksum/schema-digest verification;
2. focused TypeScript and lint for changed production files;
3. static proof that active News/Affiliate paths contain none of the rejected
   mixed-database fallbacks or runtime DDL;
4. disposable database proof for News insert, canonical merge, identical retry,
   immutable versioning, affiliate first-touch retention and Platform-user
   isolation;
5. pre- and post-migration online backups with independent restore checks;
6. exact legacy-to-replacement News row field digests and counts;
7. full replacement database integrity/count reconciliation after migrations;
8. confirmation that legacy source hashes/counts remain unchanged;
9. confirmation that production, ports, Git staging, commits and deployment are
   untouched.

Focused Vitest files are written but not run while the current repository test
instruction prohibits Vitest. Broad regression, production build, browser/E2E,
hosted transfer and final Discord identity activation remain Phase 6 work.

## Stop conditions

Stop the affected operation if the source changes after backup, backup and
restore differ, the one News row cannot reconcile losslessly, a hosted identity
cannot map without guessing, runtime schema validation would mutate data, an
unexpected affiliate row appears, or overlapping writes appear in this checkout.

## Technical completion evidence

- Legacy mixed source backup:
  `C:\Users\jerac\Documents\TraderLink\private-data\legacy-app\backups\phase-5-f4-news-20260802T150044Z\trader-intelligence-online-backup.sqlite`.
- Independent restore: matching `restore-verification` directory.
- Backup and restore are byte-identical at SHA-256
  `90772646d43f121778edae92b6cbbe82172e4947e09cbf63393757be8ae3f74b`;
  source/backup/restore schema digest, all counts, `quick_check` and privacy-safe
  News-row digest match. The live source retained SHA-256
  `ae976482866435799bf06a1dec8188d0e3b4f3fb8d7565b93cfafa523e1c4f37`.
- Pre-F4 replacement backup/restore pair:
  `phase-5-f4-20260802T150245Z`, byte-identical SHA-256
  `58ee0ab12aea89181e8af594a33fcbda07ef954c9746745f1b684d4df0831790`.
- Post-F4 replacement backup/restore pair:
  `phase-5-f4-post-20260802T151122Z`, byte-identical SHA-256
  `f321a25b3f44dbf3703a0b817b6632839d31339609461bce4babcb589954b9a6`.
- Migrations 0015-0016 produce schema digest
  `0c70a9a63c5716034b2a68f80ba2965511c6fba5277680ef547febefccb20311`.
  The real database has 16 migrations, 59 domain tables plus the registry,
  size 11,268,096 bytes and main-file SHA-256
  `9f14fade99348729336044c36f30edd4c9f0ad53a75dcb2de7b3eb5b9b9fae5d`.
- The legacy import produced one article and one version with content digest
  `fe75ca0625fd083af13e171e4fe08e4568055fb3599b3e911674e19ca6434058`;
  its second run returned `already_present` with unchanged counts.
- The fresh 16-migration disposable proof produced two News revisions from a
  canonical-source priority change, retained the higher-priority content on a
  lower-priority retry, enforced version immutability and retained first-touch
  affiliate ownership.
- Focused TypeScript, targeted lint, static migration verification, the
  117-file active replacement guard, full schema/count/integrity verification
  and documentation checks pass. Focused Vitest remains policy-deferred.
- Ports, production data, Git staging/commit/push and deployment were untouched.
