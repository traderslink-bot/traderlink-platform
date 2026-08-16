# AI Chat QA Findings Remediation

## Status

**Implementation, local database migration and controlled browser acceptance
complete.** This record covers the owner-authorized continuous correction run
following the 2026-08-16 AI Chat QA review.

## Controlling product scope

The current dashboard capability matrix remains the finite Chat target. The
route inventory was rechecked before implementation:

- Selection Loop is not a current dashboard feature and is not added to Chat.
- `/reflection-loop` redirects to the current AI Reviews page.
- Analytics Lab is incomplete and its current routes redirect to Analytics, so
  Chat does not expose a Lab tool or imply that the Lab is live.
- Trade Explorer remains the matrix's isolated bounded adapter because the page
  is current but its product contract is explicitly incomplete.

## Corrected findings

### Exact provider usage and cost receipts

The Agents SDK adapter now retains cached-read and cache-write input counts from
the provider response in addition to total input and output. Receipt cost uses
four non-overlapping classes:

1. ordinary input excludes cached-read and cache-write tokens;
2. cached-read input uses its saved cached-input rate;
3. cache-write input uses its saved cache-write rate; and
4. output uses its saved output rate.

Provider settings, generation reservations, immutable attempts, receipts and
finalized actuals now carry all four rate snapshots. Reservations use the
highest configured input-class rate for the maximum input envelope, so a cache
mix cannot under-reserve the spend cap. Missing or overlapping usage fails
closed.

Migration `0058_coach_ai_chat_cache_accounting` adds the required columns and
database guards. It intentionally leaves the two new prices unset for the
existing configuration. Chat cannot be enabled until the owner supplies all
four prices; no current or future provider rate was guessed or copied from a
different model.

### Desktop drawer room

The global drawer now uses the available desktop viewport up to a bounded
maximum, giving the conversation list and active thread useful room together.
The mobile contract remains full width, closable and route-preserving.

## Database safety evidence

- The protected local database was confirmed at migration 57 before the write.
- A disposable copy applied only migration 58 and preserved all rows in the
  three affected Chat tables and the existing model/input/output settings.
- The disposable verifier proved the new columns, price guards, exact cached
  receipt cost, foreign keys and SQLite quick check.
- A separate online backup and independent restored copy matched the exact
  migration registry, table counts, page geometry and file identity, with
  recovery authority verified.
- Migration 58 then applied once to the local database. A post-migration run
  confirmed the schema was current, the new rates remained unset, the same
  accounting checks passed and integrity remained clean.

## Help Center review

The AI Chat guides already describe the drawer as opening beside the current
page on larger screens and filling the screen on mobile. The width correction
does not change the trader workflow or available actions. Provider price fields
are owner-administration controls, not a normal trader feature. No Help Center
guide change is required.

## Verification boundary

The repository instruction for this run prohibits Vitest and other test-runner
execution. The affected fixtures were updated for the new required contract,
but they were not executed. Final acceptance uses the dedicated operational
cache verifier, targeted no-emit TypeScript and lint checks, whitespace checks,
and a controlled no-worker browser review of the shared drawer.

Targeted lint and the dedicated cache verifier pass. The full no-emit
TypeScript command reaches one type mismatch in the already-dirty concurrent
language-inventory test; it reports no error in this remediation's files. That
unrelated working-tree change was preserved and was not included in this
slice.

The controlled browser pass confirmed:

- at 1280 by 720, the right drawer is 860 pixels wide, the 288-pixel history
  pane and active conversation have useful room, and the saved title and
  selected scope are not clipped;
- at 390 by 844, Chat fills the viewport, exposes a separate conversation-list
  back control and an always-visible Chat close control;
- opening and closing the drawer preserves `/workspace` on both viewports;
- the direct `/ai-chat` page renders the same shared conversation surface;
- all conversation, message and draft reads returned successfully with no
  browser warning or error; and
- the no-worker review server was stopped after acceptance.

## Remaining launch boundary

Production activation still requires explicit official prices for ordinary
input, cached input, cache-write input and output, plus the accepted model,
entitlement and request/token/spend caps. This remediation does not enable a
provider, make a paid request, push, deploy or publish.
