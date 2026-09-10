# Daily Watchlist Recaps Plan

**Status:** Owner approved; implementation authorized

**Progress:** [Daily Watchlist Recaps Implementation Progress](watchlist-daily-recaps-implementation-progress.md)

## Outcome

The owner can generate factual Daily Watchlist Recaps on demand, review each
activation separately, select and edit the useful recaps, review the exact
combined Discord body, and explicitly post it. Generation and selection never
post to Discord. There is no scheduled generation or scheduled Discord post.

Version 1 is deterministic. It makes no OpenAI or new market-data request.

## Controlling product inventory

- One candidate represents one Watchlist activation. The exact posted time and
  initial posted price are the result baseline for an alert-price continuation;
  an AI Read pullback recovery instead uses its actual accepted pullback price
  through the later recovery high. Re-adding a symbol creates a new candidate.
- Preserve compact facts needed to describe later movement: first/latest/high/
  low accepted prices and times, high after low, active or removed state, final
  accepted removal time, pre-existing AI Read and Potential Path revisions, and
  material zone interactions.
- A later AI Read or Potential Path snapshot can never describe earlier price
  action. Removed candidates freeze at their final accepted snapshot.
- A factual later price alone can produce a draft. Do not require a complete AI
  Read, Potential Path map, or market session.
- Deterministic drafts describe the posted price/time and later factual price
  sequence. Continuation results use the posted price; AI Read dip-buy results
  use the actual pullback price through the later recovery high. They never
  claim a member bought, sold, entered, exited, or captured a move.
- Pullback and Needs-to-hold language is allowed only when pre-existing
  evidence proves it. **Held**, **reclaimed**, and **approached** remain
  separate factual outcomes. A stock can turn higher before reaching a published
  area. Describe the actual dip and subsequent run from that price without a
  fixed proximity cutoff or implying that the area was reached. For example,
  a 10% dip can recover successfully even if the area is 15% below the post.
  A later lower dip never erases an earlier completed recovery.
- Successful recovery stories use only the regular/shallow pullback plan, never
  the deep recovery. If a later higher run follows a break below the regular
  area, report the posted-price-to-high potential gain rather than highlighting
  the earlier small bounce. Preserve reached breakout/next-analysis levels.
- If the initial high precedes a successful regular pullback and later run,
  include both moves in chronological sentences with their separate baselines.
  The second run need not exceed the initial high. Never add the percentages.
- Breakout language names only the AI Read's published **Where the trade could
  go next** levels that price actually cleared. A continuation's potential gain
  is the Watchlist posted price to its factual high; a pullback recovery's
  result is the actual pullback price to its later recovery high. These are
  factual analysis outcomes, never member entries or universal trading
  instructions.
- Each generation creates an immutable evidence-backed draft revision. The
  owner can edit the full ticker recap; edits create immutable revisions while
  preserving the generated original.
- The current review states are **Unreviewed**, **Add to recap**, **Don't use**,
  and **Posted**. **Flag for audit** separately retains the draft, evidence,
  note and marked time until resolved. It never changes selection or blocks
  owner editing or posting.
- Admin Watchlist gains a Platform-owned **Daily Recaps** section beside
  **Usage**, not a duplicate runtime screen. Its toolbar has a New York date,
  **Generate all recaps**, and factual counters. Each ticker card has
  **Generate recap** or **Regenerate recap** and the three review actions.
- The **Discord post** area preserves selected order, allows full-body editing,
  shows the exact final body, and requires an explicit **Post to Discord**
  confirmation. Discord contains no generator, edit, owner, or system label.
- **Save final post** durably saves the combined owner text without posting or
  changing selections. **Use selected recaps** explicitly replaces that body
  after confirmation. Delivery marks only the exact submitted ticker revisions
  posted, leaving newer edits available.
- Final bodies retain their selected ticker/revision associations through edits,
  saves and reloads. Changing candidate selections does not rewrite a reviewed
  body's associations; Use selected recaps explicitly replaces body and items
  together. Each save preserves a separate immutable composition snapshot.
- The server-only runtime appends `@everyone` and the configured Premium
  Members mention as the fixed footer. The browser neither sees a Discord token
  or webhook nor chooses a destination. The owner-provided private channel is
  a controlled server-side test destination only.
- Platform owns facts, drafts, review state, correction queue, compositions,
  and receipts. The canonical runtime remains the only Discord publisher and
  accepts only an authenticated idempotent reviewed-post instruction.
- A double click or repeated browser request with the same idempotency key can
  create at most one Discord post. The exact posted body, time, receipt/link,
  and idempotency key remain after optional cleanup.
- **Stored recap data** shows draft/posted/correction counts, oldest date, and
  approximate size. Cleanup is manual, recommends review after 30 days, and
  never silently deletes Needs correction records.
- The current automatic 3:55 PM top-three recap service stays unchanged until
  this reviewed path is deployed and verified in a coordinated replacement
  release. There must never be two recap publishers or a delivery gap.

## Implementation sequence

1. Add durable Platform storage and capture factual activation/evidence events.
2. Add deterministic generation, immutable draft/review/composition records,
   owner-only APIs, and the owner-visible Admin section.
3. Add the narrow runtime reviewed-post instruction and idempotent receipt
   path, using the private test destination only at the controlled test gate.
4. Retire the old automatic service only in the release that verifies the full
   reviewed replacement end to end.

## Migration boundary

The earlier planning reservation `0096_platform_watchlist_daily_recaps` is no
longer usable because the current Platform manifest has advanced through
`0100_platform_watchlist_visibility`. Before the storage implementation is
registered, allocate the next free Platform migration id against the current
release parent; do not reuse or reorder an old migration id.
