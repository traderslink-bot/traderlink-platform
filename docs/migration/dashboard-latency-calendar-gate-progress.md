# Dashboard latency Calendar gate progress

Linked plan: [dashboard-latency-calendar-gate-plan.md](dashboard-latency-calendar-gate-plan.md)

## 2026-09-02 — prepared

- Owner authorized a reversible live Calendar-disable experiment for dashboard
  latency testing.
- Baseline is live Platform source `9090818608f5bae8f2dd98e3717e36dba5f8139a`.
- Source inspection found that Calendar first performs an unbounded catalog
  read and then a selected month/week read inside the all-fact-set reporting
  runtime. The experiment gates that route before either read can begin.
- Implemented the inert-by-default server-only gate in
  `calendar-performance-test.ts`; when the exact production variable is `true`,
  the Calendar route redirects to Workspace before reading `searchParams`,
  identity, Calendar data, or offline data.
- No Railway variable, migration, deployment, or test action has run from this
  record yet.
