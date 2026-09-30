# Watchlist removal and support retirement progress

Implementation complete in exact-parent candidates; deployment and hosted acceptance pending. Shared dirty files are preserved. No Discord messages deleted, no X posts attempted, no deployment performed.

Focused offline verification passed: default-on setting, off preserves posts, exact acknowledged receipt deduplication, exact channel/message DELETE, Discord unknown-message idempotency, permission failures visible, and Crisp import/component/dependency removal. Candidate TypeScript syntax checks passed. No broad tests, local server, or local production build were run.

Runtime queue/settings use one new JSON file in the existing durable runtime directory. No migration or new environment variables. Deletion uses the existing Discord bot credentials and requires permission in each destination channel. Failed operations remain visible rather than being silently retried; turning Off cancels remaining pending work. Existing retained messages without receipts cannot be guessed safely. Crisp retirement removes local source/dependency only; historical external chat records/account are not deleted.

Plan QA: exact receipts avoid broad channel deletion; background durable queue avoids delaying removal; unknown legacy messages remain explicitly untracked rather than guessed. Setting Off cancels pending work that has not started; already completed deletion cannot be undone.
