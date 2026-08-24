# Journal Administration User Health Progress

**Status:** Implementation complete — Railway release coordination pending

**Started:** 2026-08-24

**Controlling plan:** [Journal Administration User Health Plan](journal-admin-user-health-plan.md)

**Parent plan:** [TraderLink Journal Administration Dashboard Plan](journal-admin-dashboard-plan.md)

## Boundary

- Work remains inside the existing private `/admin/journal/users` administration
  surface.
- This feature does not contact users, modify live user status, revoke a
  session or connect to a broker during implementation verification.
- Production account-control mutations remain available only through the
  guarded owner flow; no user record was changed while building this feature.

## User Health 0 — Contract and inventory

**Status:** Complete

- [x] Define Enabled, Online now, Last dashboard sign-in, Last Journal
      activity, Journal started, broker source/connection and failure states.
- [x] Record the existing Users-page label correction: `active` means enabled,
      and existing Last active is Journal activity.
- [x] Define the no-guess Academy-origin rule and privacy-safe source boundary.
- [x] Link this scope from the parent plan and migration progress record.

## User Health 1 — Truthful labels and activity read model

**Status:** Complete

- [x] Implement exact labels and add sign-in, Online now, Journal started,
      Academy progress, manual entries and import outcome facts.

## User Health 2 — Import and broker support evidence

**Status:** Complete

- [x] Add safe per-user failure history and only verified broker-connection
      evidence.

## User Health 3 — Needs attention and operating views

**Status:** Complete

- [x] Add derived attention states, filters and the owner-only operating views.

## User Health 4 — Guarded account controls

**Status:** Complete

- [x] Add audited disable, enable and device sign-out controls.

## User Health 5 — Owner review and acceptance

**Status:** Release coordination pending

- [x] Complete focused one-worker user-service and account-control verification.
- [x] Complete scoped TypeScript, lint and whitespace checks.
- [x] Complete responsive desktop/table and narrow-screen/card implementation.
- [ ] Confirm the Railway release slot, publish the narrow commit and verify
      deployment plus `/api/platform/health`.
