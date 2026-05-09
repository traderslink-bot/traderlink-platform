# Session Time Intelligence Follow-Up Plan

## Current Status

The implementation and follow-up pass are complete except for the intentionally parked timezone display preference.

- CSV imports classify trades into Eastern Time market buckets from execution timestamps.
- Analytics rows and reports include entry session, entry hour, held-through sessions, and cross-session hold flags.
- Import dry-run and analytics UI expose the first version of session/hour visibility.
- Focused tests, TypeScript, production build, and the private April IBKR CSV smoke check passed.
- Public-safe real-data readiness reporting, timezone diagnostics, compatibility hardening, trade detail display, guarded coaching copy, and QA coverage have been added.

## Remaining Product Work

Status: completed unless marked parked.

1. Public-safe real-data readiness report
   - Produce an aggregate-only report from the April IBKR CSV smoke check.
   - Include accepted executions, grouped trades, session distribution, top entry hours, and cross-session hold counts.
   - Do not include private filenames, account identifiers, raw rows, symbols, or trade-level details in public docs.

2. Time intelligence dashboard polish
   - Add a clearer analytics section for best/worst entry session, best/worst entry hour, and cross-session hold outcomes.
   - Separate market-session performance from held-through performance so users do not confuse entry attribution with exposure.
   - Add empty/small-sample copy that warns users not to over-trust tiny samples.

3. Coaching insight layer
   - Add coaching language that can say things like "your pre-market entries are working, but holding into midday is where giveback appears."
   - Keep this execution-only until market context is explicitly available.
   - Gate claims by sample size.

4. Review and trade detail surfaces
   - Show entry session/hour and held-through labels on individual trade review pages.
   - Add a simple timeline-style display for trades that cross pre-market/open/midday/post-market/overnight.
   - Keep canonical session labels in Eastern Time.

5. Parked timezone display preference
   - Status: parked by product decision.
   - Keep analytics classification canonical in Eastern Time.
   - Later, add a display preference for local/account timezone timestamps.
   - Local/account timezone display should not change session bucket, entry-hour ET analytics, or coaching classification.

6. Backward compatibility and migration checks
   - Confirm older saved trades without entry-hour/session-exposure fields still render safely.
   - Add a compatibility helper if saved reports need derived display defaults.
   - Keep legacy `close` and `after_hours` labels readable while new imports use timestamp-derived buckets.

7. Broker timezone and import diagnostics
   - Make timezone parsing issues visible in import review when timestamps are date-only or account-timezone dependent.
   - Add a diagnostic summary showing the account timezone used for parsing and Eastern Time used for session classification.
   - Add tests for non-Eastern account timezone imports so the source timestamp timezone and ET session classification stay distinct.

8. Export and report readiness
   - Include entry session, entry hour, held-through sessions, and cross-session flags in future CSV/report exports.
   - Add aggregate-only export fields for real-data readiness reports.
   - Avoid exporting private raw timestamps unless the export is explicitly user-owned.

9. QA and regression coverage
   - Add Playwright coverage for `/analytics` session/hour filters.
   - Add import dry-run UI assertions for entry session/hour and held-through labels.
   - Add a real-data smoke script that reports only aggregate counts and can be rerun without exposing private CSV details.

## Sequencing

1. Build the public-safe real-data readiness report first.
2. Add compatibility and timezone diagnostics before deeper UI polish.
3. Polish analytics dashboard and trade detail surfaces after the data contract is stable.
4. Add coaching language last, once sample-size gates and attribution labels are clear.

## Scope Boundaries

- The current bucket model is for U.S. equity market structure.
- Do not silently reuse these buckets for futures, crypto, non-U.S. equities, or asset classes with different trading sessions.
- Options rows can inherit the underlying U.S. equity-style clock only after options import support is intentionally enabled.
- Session performance remains entry-attributed; held-through exposure is a separate lens, not per-hour P/L allocation.

## Canonical Bucket Boundaries

- `overnight`: 8:00 PM to 4:00 AM ET.
- `pre_market`: 4:00 AM to 9:30 AM ET.
- `market_open`: 9:30 AM to 11:00 AM ET.
- `midday`: 11:00 AM to 4:00 PM ET.
- `post_market`: 4:00 PM to 8:00 PM ET.
- Boundaries are half-open, so `9:30 AM` belongs to `market_open`, `11:00 AM` belongs to `midday`, and `4:00 PM` belongs to `post_market`.

## Acceptance Criteria

- A user can answer which ET session and hour they enter best.
- A user can answer whether holding across sessions helps or hurts them.
- Reports distinguish entry-time attribution from held-through exposure.
- Real-data readiness documentation uses only aggregate-safe counts.
- The UI remains clear that U.S. equity session logic is based on Eastern Time.
- Older saved reports without the new fields do not crash product routes.
- Import review clearly shows which timezone parsed source timestamps and which timezone defines market sessions.
- Non-U.S. or unsupported asset/session types do not receive misleading U.S. equity session labels.

## Suggested Next Step

Use `src/docs/session-time-real-data-readiness-2026-05-06.md` as the public-safe aggregate readiness artifact, then continue with the broader real-data readiness/reporting roadmap outside the session-time branch.
