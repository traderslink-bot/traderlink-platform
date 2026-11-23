# Retire unsupported Press Release filters

Owner directs removal of AI summary status and any inaccurate/unverified filters. Remove the entire News type selector until publisher classification coverage is qualified; existing article SEC labels and underlying analysis/fallback handling remain.

Remove type/summary from the canonical NewsFilters contract, UI controls/chips, saved-view descriptions and SQL predicates. Older preferences/saved views ignore those retired keys while retaining exact cap/ticker/date/read/search/sort choices. No storage migration or automated preference update is needed.

An enabled saved alert with an active retired criterion must not broaden silently. Read it as paused/requires review, skip it during matching/claim, and require explicit review/save of the remaining criteria. A reviewed enabled alert starts at the review time; pre-review articles are not replayed. Existing channel subscriptions and valid saved alerts retain their independent behavior. No real sends, provider calls, policy changes or production data writes.

Retained filters: exact ticker matching; literal ticker/headline search; explicit USD cap values/units and known/unknown selection; Eastern-time publication dates/relative periods; stable user read receipts; deterministic date/ticker/cap sorting. Their query behavior and boundaries have meaningful SQLite regression tests. No semantic catalyst classifier is claimed.

Assigned source lane remains news-ingestion-current-main-20261122, base8890, with immutable prior 19-file source locally preserved by the Coordinator at51735d07. Frozen V1 packet and QA receipt stay unchanged; this follow-up is a separate delta against that preservation commit. Premium stays off. DO NOT DEPLOY or apply the earlier0227 migration without explicit owner approval.

Validation complete: 35 initial focused tests plus one added compatibility regression (36 distinct cases across checkpoints); final feed suite 14 passed. Targeted lint and TypeScript pass (24 roots, 2180 reachable files, zero diagnostics). All seven native checks pass: desktop/portrait/landscape Light/Navy filters plus explicit saved-alert review/save. A readonly private-fixture check confirms retired keys gone, revision2 and a new post-review alert start time. Prior drawer-animation harness failure and the final common-guard refusal are retained. No successful review/save was replayed. All owned units/children closed and ports3010/3097 closed. Production deployment remains unperformed.
