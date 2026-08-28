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
- A later deterministic materializer consumes this accepted source in one
  transaction, writes canonical Journal executions first, then writes the demo
  account marker and execution provenance last. It writes ordinary immutable
  per-account Analyzer facts rather than queuing a provider job.
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
