# Master Scanner matches for Personal Alerts

The Scanner supplies versioned match observations for Top Gainers, Momentum, Top Losers, HOD Drops, Breakouts, Market Events, private saved scans, and scans opened through an active share link. Personal Alerts owns rule setup, repeat policy, history, and delivery.

## Server contract

The entry point is `src/modules/scanner/custom/server/master-scan-matches.ts`. It accepts a server-resolved TraderLink user and workspace. It loads current membership, account status and Scanner admission for each evaluation, replay and evidence read. Historical observations stay scoped to the same user, workspace, scan and version.

| Operation | Behavior |
| --- | --- |
| `listMasterScanSources` | Lists eligible live presets, private saved scans and shares previously registered by the recipient. |
| `resolveMasterScanSource` | Resolves a preset ID, private saved ID or a shared publication link. A valid link registers the share for that user and workspace and returns an opaque version. |
| `resolveMasterScanAccess` | Distinguishes lost access from a changed rule version that needs review. |
| `openMasterScanMatches` | Captures existing Scanner publications while a consumer needs the pin. Attaches any saved-rule enrichment to the existing market feed. Returns a cleanup function. |
| `captureMasterScanMatches` | Samples current qualified data on demand. Useful for establishing a baseline or an already warm feed. |
| `readMasterScanMatches` | Replays in increasing sequence order and indicates a cursor gap if requested observations expired. A consumer should establish a new complete baseline after a gap. |
| `readMasterScanMatchEvidence` | Resolves an opaque match reference for the same recipient, scan, version, instrument and timestamp. Returns only the ticker and allowed reason codes. |
| `verifyMasterScanMatchEvidence` | Performs final evidence checks, including qualified private Levels receipts, and rechecks authorization after asynchronous reads. |

A preset uses the real Scanner configuration revision stamped at evaluation. Starter templates never supply alert results. A private saved scan retains its per-scan version through renames and unrelated edits. Editing the definition creates a new version even when the user later restores the original values. Older saved books are readable without migration. A shared scan retains one stable ID across publications. Its opaque version cannot be used as a link or to register another account. The original link ID stays in Scanner's private ledger. Revoking, republishing, or downgrading a share retires its exact old publication and queued evidence. Recipients establish access to the new publication through its link. There is no addressed re-share event in the existing link system.

## Observations and coverage

- Each run records the session, detection time, coverage, sequence and a stable replay ID. Each match records the exchange and ticker, observation time, and an opaque evidence reference. Existing Momentum activations preserve their trusted first and repeat detection times. Results omit private rule values, ranking values, raw receipts, and redistribution-sensitive prices.
- Complete snapshots may clear previously known matches. Truncation, missing data, and unavailable rules cannot imply an exit. Market Events uses the authorized compact-card headline source, date windows and market-cap policy with active halt data. The producer can include qualifying headlines beyond the UI's display cap, and flags truncation of the source census. Current article and private Levels access is checked for evidence that depends on them.
- The Scanner-owned SQLite ledger uses the private application data directory, following the existing shared-scan storage pattern. It retains at most 2,048 observations per recipient and version for up to seven days. Sequence counters survive a restart and expired rows. A consumer that falls behind sees an explicit replay gap. The producer runs only while an authorized consumer captures or subscribes.
- The earlier Momentum pilot used a separate sequence format. Master Scanner versions use `master-1:<revision>`. An existing pilot rule must review and establish a baseline before moving to the new producer.

## Acceptance

Exercise all three source types, complete and partial coverage, same-ticker isolation, replay and restart, and withholding evidence after a publication, rule or membership change. Run the Scanner producer and Personal Alerts consumer together with synthetic market and Discord inputs. The release candidate stays local pending owner authorization.

The Scanner checkpoint passed 158 focused tests across nine files, plus scoped TypeScript and ESLint. It covers the six preset choices, ordered restart replay, evidence isolation, source edits and revocation, and the actual saved-rule evaluator with more than one page of matches. Live feeds and live Discord delivery are outside this checkpoint.

Personal Alerts verified the combined producer, runtime subscriptions, replay, rule repository and Discord outbox with synthetic market inputs and transport. A built-in and a private saved scan each produced one authorized alert. Editing the saved rule or revoking a registered share during final evidence verification blocked the queued send and removed access to the stale evidence. The shared version did not grant access in another account or workspace. The [combined run](/home/traderlink/preview-runtime/personal-alerts-tests-20261122/exact-alert-center.t0cw4d/master-scanner-runtime.DND2lf/vitest-final.log) passed 91 tests across seven files. The composed candidate also passed TypeScript and scoped ESLint. [Candidate manifest](/home/traderlink/preview-runtime/personal-alerts-tests-20261122/exact-alert-center.t0cw4d/master-scanner-runtime.DND2lf/manifest.json)

In that combined checkpoint, the Alerts adapter accepts four preset IDs. Personal Alerts still needs to route the new Momentum and Market Events versions alongside the existing Momentum pilot and dedicated news and halt rules. The Scanner producer exposes both versions for that follow-up.

Saved financial matches retain a private Company snapshot revision, observation cutoff, and the readings, reporting periods, scopes, units, and filing accessions used for the matched rules. Before alert delivery, the verifier reads that same ticker, cutoff, and revision from the gateway, checks the readings and accessions, and rechecks access to the saved scan version. Reopened saved scans and the Personal Alerts consumer passed the CLRO minimum-revenue and exact-zero joint replay. [Financial filter acceptance](scanner-filter-audit-20261126.md#saved-financial-filters-and-personal-alerts-share-a-company-filing)
