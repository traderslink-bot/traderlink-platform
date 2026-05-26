# Trader Analytics Production Safety Checklist

## Purpose

This checklist keeps production end-user analytics separate from debug/admin
analytics.

Use it before adding or changing any production analytics route.

## Production Route Checklist

Required for end-user analytics routes:

- no raw JSON panel
- no JSON, CSV, spreadsheet, or raw-data export button
- no route-contract or debug API copy
- no provider/candle/engine internals unless shown in a calibrated
  market-context section
- sample data must be clearly labeled as sample data
- report history stays inside the app
- comparisons stay inside the app
- drill-downs link to in-app trade review pages
- notes and review status stay inside the app
- market-context fields do not alter execution-only metrics

## Debug/Admin Allowances

Allowed only on `/debug/` or future admin surfaces:

- raw report JSON
- route contract descriptions
- diagnostic payloads
- internal failure classification
- provider/shared-engine diagnostics

Debug wording:

```text
Debug raw JSON is for development and QA only. Do not include raw report
payloads or export controls on production end-user analytics routes.
```

## Implemented Guardrail Helper

The production route audit helper lives in:

```text
src/lib/trader-analytics/product/production-guardrails.ts
```

It exposes:

- `PRODUCTION_ANALYTICS_NO_EXPORT_CHECKLIST`
- `DEBUG_RAW_JSON_COPY`
- `auditProductionAnalyticsSurface(...)`

Current `/analytics` fixture-backed surface is audited with:

- `hasRawJsonPanel: false`
- `hasExportControl: false`
- `hasDebugCopy: false`
- sample data labeled

## Retention Draft

Before launch, define:

- how long saved trades are retained
- how long saved reports are retained
- whether deleted trades remove related report snapshots
- whether report notes are retained separately
- admin/support access rules

Until then, fixture and in-memory data must not be presented as a real
persistence or security model.

## Permissions/Auth Assumptions

Current implementation uses deterministic fixture IDs:

- `sample-user`
- `sample-account`

This is not an authentication model.

Future production work must choose real auth, workspace/account boundaries, and
server-side authorization before accepting real user data.

## Controlled Beta Storage Boundary

For current single-tester or trusted-beta verification, saved imports can use
the local SQLite path as `local_sqlite_single_user` storage.

This is acceptable only when:

- one tester or one trusted workspace owns the environment
- imported CSVs do not contain unrelated customer data
- testers understand the app is storing local beta review data, not isolated
  production account data
- auth, tenant isolation, billing, and server-side authorization are explicitly
  deferred

Do not describe local SQLite beta storage as authenticated production
persistence. Before a broader paid launch, replace this boundary with real auth,
account-scoped authorization, migration/backup policy, and deletion controls.
