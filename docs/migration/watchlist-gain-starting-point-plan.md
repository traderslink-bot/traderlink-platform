# Gain starting point

Owner-approved October 15: use first member publication quote for Potential Gain; add per-ticker price/time override in More actions, Save and Reset to Watchlist publication. Preserve public posted identity, analysis, notifications and Codespaces work. No deployment.

Implementation inventory: pure gain calculation/history helper; existing store publication/ticker mutations and atomic owner edit; owner-authenticated GET/POST route; lazy admin dialog and More actions hook; gain card wording/coverage; daily-recap publication-evidence isolation; Help. JSON state extension only, no migration. Older cards retain their recorded baseline separately when publication metadata is missing. No publication price is invented; resetting specifically to publication still requires that saved price.

Store a bounded suffix-maxima observation history to recompute highs after a selected time. No provider requests. Earlier unavailable observations are disclosed, not fabricated. Normal streaming keeps its running high when bounded history trims; a separate publication maximum preserves reset correctness. Owner recalculation uses retained evidence only. Equal-time revised quotes retain the highest observed value, consistent with an observed-high metric rather than a candle correction engine.

The three independent QA findings are corrected in the source candidate. Both focused regression scripts pass. Hosted UI acceptance and release remain separate and unperformed; see the latest progress checkpoint before integration.

Build as exact-parent candidate against current saved origin/main, leaving dirty shared files untouched. Focused pure/store/request/UI checks only; no local production build. Reconcile with current remote parent during separately authorized release.

Progress: [record](watchlist-gain-starting-point-progress.md).

## October 27 extension — Edit Gain Card

Add an owner-editable Highest after added price in the existing dialog; rename
the row action Edit Gain Card and the separate posting action Post Gain.
Saving changes the gain card only, without provider requests or notifications.
A correction replaces the selected baseline's calculated high, including a
mistaken recorded high. Subsequent fresh higher observations can advance it.
Changing the starting time clears a previous high correction unless a new high
is explicitly supplied. Reset restores publication tracking and clears the
correction. Keep recap market evidence separate from owner corrections.
