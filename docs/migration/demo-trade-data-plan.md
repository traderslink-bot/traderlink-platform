# Demo Trade Data Plan

**Status:** Active implementation

**Progress:** [Demo Trade Data Progress](demo-trade-data-progress.md)

## Outcome

A genuinely new TraderLink user receives one isolated **Demo Trade Tracker**
that makes the Dashboard, Daily Trade Tracker, Trade Explorer, Calendar,
Analytics, and Trade Analyzer understandable before the trader has entered a
real execution. Demo data is visibly identified, account-scoped, read-only,
and removed only through **Clear demo data and start fresh →** with the normal
explicit erasure confirmation.

The ordinary first-time onboarding returns after that demo account is erased.
Existing real accounts are never seeded; a separately scoped invitation may
open a separate demo account without changing the real account.

## Approved experience

1. `/workspace` shows the approved red-bordered **Viewing Demo Data** callout
   immediately below the title while the active account is demo data.
2. Every trading-data screen shows the compact **Viewing demo data** indicator
   with the direct **Clear demo data and start fresh →** action in the same
   location.
3. Demo rows remain readable but reject manual Journal writes, imports, AI,
   notifications, Discord activity, paid-provider work, and Analyzer jobs.
4. Clearing the demo account deletes only its account-scoped facts and returns
   the trader to ordinary `/workspace` onboarding. It never silently deletes
   or merges demo facts when a real trade or broker import arrives.

### Demo-state UX boundary

- The Dashboard frame shows the compact indicator at the top of every
  dashboard data page except `/workspace`, where the larger approved callout
  replaces it directly below the title. Account settings also labels the
  active Demo Trade Tracker account.
- The compact indicator does not rely on a browser flag: the server resolves
  the active account against `journal_demo_accounts`. Demo Daily Tracker views
  are read-only and hide manual-entry and Moomoo-connection prompts.
- The clear action posts only `demo_trade_tracker_account` with the selected
  account reference and explicit `DELETE ACCOUNT` confirmation. The server
  independently verifies that the selected active account is the caller's
  mapped demo account before using the existing scoped account-erasure
  service. A normal account cannot be deleted through this action.

## Current immutable Daily Tracker market inventory

The checksum-gated financial source may use **only** the following verified
Moomoo one-minute extended-session inputs. It never retrieves market data at
login or during materialization.

| Date | Symbols | Intended demo day |
| --- | --- | --- |
| 2026-08-26 | YYGH, CRE, SOAR, XPON | 12 long-only closed trades / 43 executions |
| 2026-08-27 | CELU, PPCB, LGPS, CHOW | 12 long-only closed trades / 43 executions |

The source evidence manifest SHA-256 is
`f3976daae06a3949bcdacba1e922cabb7f72c5614877745dfa33ae446af40b1a`.
`WSHP` is permanently excluded after provider payload unavailability. `ANF`
was validation evidence only and is not a demo trade or pack input. No prior
pair is admitted.

Each synthetic execution uses the exact close and minute of an immutable,
verified Moomoo candle. It is labelled as a synthetic demo execution derived
from verified market data; it is never represented as a historical trader
order. Quantities, per-execution fees, notes, tags, and rule outcomes are demo
content added through the normal Journal contracts only after the financial
pack is accepted.

## Financial-pack and Analyzer contract

- The pack source validates the exact eight sessions, session/page/bar
  metadata, source-evidence manifest hash, raw-page hash and normalized-bar
  hash before producing any fact.
- It rejects a missing, duplicate, out-of-window, unordered, incompatible or
  checksum-mismatched session. It also retains the unadjusted-price continuity
  ambiguity guard and requires corporate-action review before materialization.
- Every selected execution minute must have its exact candle, and each normal
  Daily Trade Analyzer target uses the existing target-or-prior-minute
  availability semantics. No full-session fabricated-candle requirement is
  introduced.
- The in-repository market pack holds exactly the eight sanitized normalized
  candle arrays and retains every source, raw-page, evidence-file, normalized
  bar and pack checksum. The deterministic materializer consumes it in one
  transaction, writes canonical Journal executions and ordinary immutable
  per-account Analyzer facts, then writes the demo account marker and execution
  provenance last. It never queues a provider job.
- No database migration is included in this source slice. The future demo
  schema is reserved as `0095`; production currently ends at `0094`.

## Dashboard pack boundary

The separately approved long-only micro-cap Dashboard pack remains separate
from the two Analyzer-backed Daily Tracker days. Its synthetic executions do
not use or imply Moomoo historical candle facts, and it must not be combined
with this financial source.

## Non-goals and safeguards

- No V3 analytics path, login-time provider call, broker credential, real
  account mutation, or fabricated live-market claim.
- No silent mixing with broker/manual provenance, no cross-account lookup, and
  no notification, Discord, or paid-AI side effect.
- A missing or rejected pack leaves a valid new user signed in with the normal
  empty experience; it never leaves a partial demo account or partial Journal
  facts.

## Current implementation checkpoint

The registered-but-unapplied `0095_journal_demo_trade_data` contract provides
first-class pack, account, invitation, and immutable execution-provenance
tables. Server-side Journal/annotation writers reject an active demo account,
and Daily Trade Analyzer workers expire such jobs before claiming them. New
Discord provisioning attempts the isolated demo transaction only after the
authenticated identity/workspace is committed; an unavailable pack falls back
to one ordinary Primary Journal without corrupting the valid session.

For staging owner visual review only, an unlinked owner-workspace POST can be
enabled with `TRADERLINK_DEMO_STAGING_REVIEW_ACTIVATION=enabled`. It derives
only the authenticated owner's current workspace and user server-side,
revalidates active owner membership, and calls the same checksum-gated
activation/materializer transaction. The request has no target identifier and
the response exposes only materialization state; success sets the normal opaque
account-selection cookie to the isolated Demo Trade Tracker. The route is
unavailable until that staging gate is explicitly enabled and is not a normal
onboarding or production activation path.
