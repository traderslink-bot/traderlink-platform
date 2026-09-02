# Calendar navigation-first loading plan

## Owner direction

Keep both Calendar surfaces available: standalone `/calendar` and the on-demand
Workspace Calendar panel. Month and week selectors should learn only whether
the active account has Calendar activity in a period; selecting a period then
loads that period's Calendar model.

Progress: [calendar-navigation-load-progress.md](calendar-navigation-load-progress.md)

## First safe slice

- Replace the current full Calendar model used only to populate navigation with
  an account-scoped, date-only navigation read.
- Reuse one shared navigation builder in the standalone page and Workspace API.
- Preserve the existing selected month/week Calendar model and its on-demand
  ticker-detail request.
- Keep the left navigation unchanged. The owner may later choose whether it
  opens standalone Calendar or Workspace Calendar.

## Explicit boundary

The existing analytics dashboard service materializes its all-available fact
set even for a date-filtered Calendar model. This first slice removes the
duplicated all-history Calendar aggregation and annotation work, but does not
claim that the accounting fact set is already month-bounded. A later slice may
introduce a verified bounded read model only after preserving exact financial
and timezone semantics.

## Verification and release

1. Confirm both surfaces receive the same month/week options from the shared
   date-only read.
2. Confirm each surface requests only its selected month or week for the
   visible Calendar model; ticker details remain lazy.
3. Use the production Calendar gate only until this candidate is released;
   then restore both Calendar surfaces and collect live timing evidence.
4. Do not change data, schema, migration state, account isolation, or the
   left-navigation destination in this slice.
