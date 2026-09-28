# Membership production release progress

**Status:** Production release authorized; candidate verification and guarded migration are in progress.

## Release base and preservation

- Production source parent: `3e40070f577e3b43c3279dd97809006878729f67`.
- Candidate branch: `codex/membership-production-20260928`.
- The feature was ported onto the current production source instead of copying the older mixed working tree.
- Newer production Trade Explorer, analyzer, journal, notification and watchlist behavior is preserved.
- Communities and Coaching staging-only implementation is excluded.
- The separate independent Watchlist detail and analysis split remains excluded because its owner UI acceptance is still pending.

## Migration reconciliation

- Production already uses migration identities `0132` through `0136` for unrelated migrations.
- Membership is consolidated into additive migration `0148_platform_membership_platform` without reusing those identities.
- Disposable schema comparison proved the consolidated migration creates the same 19 tables and 3 indexes as the historical five-file membership sequence, with no foreign-key violations.
- Current-production manifest initialization passed with 130 migrations and final schema SHA-256 `ad69b10debed5feb92aa92dbf7abf3e1c187de32edcc48e404429f4fa1d7deed`.

## Verification

- Focused membership TypeScript graph passed with 114 roots and zero diagnostics.
- `git diff --check` is required again on the final candidate.
- Railway build, guarded mounted-volume migration, public health and rendered production routes remain pending.

## Release gate

Before normal application deployment, the Coordinator must verify the exact live 129-migration prefix, record free space and every checkpoint database artifact, create and restore-verify the named backup, apply only migration `0148`, and prove the structured result. After the intended source is healthy, the exact temporary restore database and any completed checkpoint backup without an active recovery purpose must be removed under the Coordinator backup lifecycle. Railway-managed backups are not application checkpoint artifacts and must remain untouched.
