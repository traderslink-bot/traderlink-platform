# Broker Statement Identity And Saved Formats Progress

**Status:** Owner-approved implementation in progress
**Controlling plan:** [Journal Import Simplification And Reliability Plan](journal-import-simplification-and-reliability-plan.md)

## Approved outcome

The trader names the broker before every CSV upload. That confirmed name is
attached to the import attempt and, after a successful manual or consented AI
mapping, to the saved mapping. A later upload can reuse a mapping only when
the Trade Tracker account, broker and statement layout all match.

If two brokers genuinely use the same layout, TraderLink keeps one saved
mapping for each broker. Matching columns alone never transfers a mapping from
one broker to another.

Import Trades distinguishes **Interactive Brokers** (the verified built-in
adapter) from **Your saved statement formats** (private mappings learned in the
active Trade Tracker). A saved personal mapping does not claim that a broker is
globally supported.

## Checklist

- [x] Require broker name before statement preview and persist it on the
      existing import-attempt record.
- [x] Carry the confirmed broker into the consented AI worker and override any
      model-supplied broker label before private preview or import.
- [x] Restrict saved generic mapping lookup to the exact broker and layout.
- [x] Add the account-scoped supported-brokers read endpoint and Import Trades
      view for built-in support and saved formats.
- [x] Align Import Help Center guidance.
- [ ] Run focused static checks and present the integrated UI for owner review.
- [ ] Resume the separate live AI repair test with a new synthetic statement.
