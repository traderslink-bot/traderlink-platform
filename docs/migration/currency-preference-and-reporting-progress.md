# Currency Preference And Reporting Progress

**Status:** Owner visual review accepted; local checkpoint pending

**Controlling plan:**
[Currency Preference And Reporting Plan](currency-preference-and-reporting-plan.md)

## Implementation record

- [x] Established the owner decision: U.S. equity executions remain USD facts;
  reporting currency is a Platform-user presentation preference.
- [x] Confirmed the first supported currencies: USD, CAD, AUD, EUR, HKD, SGD
  and MYR.
- [x] Chose Bank of Canada Valet daily indicative rates as the no-key,
  no-cost reporting source, cached server-side.
- [x] Added and applied migration 0024 for Platform user preferences and
  immutable cached Bank of Canada daily-rate observations.
- [x] Added scoped preference mutation plus server-only USD reporting adapter.
- [x] Added the Account Settings control and Workspace reporting-equivalent
  panel.
- [x] Owner visually approved the Account Settings and Workspace reporting
  equivalent on 2026-08-05.

## Resume point

Refresh the local dashboard, choose a non-USD preference in Account Settings,
then review the Workspace reporting-equivalent panel. Preserve original USD
Journal facts and expose unavailable coverage instead of a guessed conversion.
