# Membership QA: replacement route-contract reconciliation

Status: read-only proposal for review; no matrix/test/runtime changes accepted.
Source: c813f492d8cf0b9bacf24bcc8a5a58b4da8da642.

## Complete discovered inventory

[Explicit route and method inventory](membership-route-boundary-inventory-2026-10-10.json)
contains all 291 routes from the failing discovery contract, with immutable source
blob, existing contract when present, every exported method, and source-line call
evidence. Counts: 119 pages; 172 APIs; 202 exported API methods. No API has an empty
method list. This is the failing check's discovery universe, not a claim that it
enumerates every application endpoint.

The previous matrix has 136 entries. Its overlap with current discovery is 134;
157 discovered entries are absent (42 pages, 115 APIs / 135 methods). Its two
non-overlapping entries are app/(dashboard)/analytics/performance/page.tsx and
app/api/auth/discord/login/route.ts. The latter exists: this is a discovery-heuristic
gap, not a reason to remove OAuth coverage. Do not silently delete either contract.

The existing scanner reports exactly 115 unclassified APIs and zero method/wrapper
violations for already classified APIs. The unclassified early return prevents
further method validation; zero method findings is not their acceptance.

## Proposed replacement test contract

1. Keep exact discovery-to-inventory equality, unique paths and complete exported
   HTTP-method coverage. Add explicit exceptions with disposition evidence for
   routes the old heuristic misses, including public OAuth entry. No skip lists.
2. Retain the existing negative fixtures: unused imports, unwrapped methods,
   mismatched wrapper module paths and unknown Journal surfaces must fail.
3. Record a reviewed contract per API method: exact guard import origin, call or
   delegated handler, caller headers/session inputs, authorization scope, mutation
   protection where appropriate, denied outcome and private-cache policy. A guard
   name or import alone is insufficient; require execution before protected reads
   or writes. Delegations must resolve to a specifically reviewed helper/module.
4. Distinguish native Platform session/workspace/feature guards, Journal owner
   administration, public OAuth state verification, session-specific sign-out,
   cron secret verification and development-only launcher denial. Do not label all
   new routes with one generic owner wrapper or restore legacy V3 dependencies.
5. For pages, prove the shared layout/frame chain, not textual co-location. Retain
   additional page-level feature/owner requirements; inherited dashboard access
   does not prove permission for private admin/data operations.
6. Resolve navigation against concrete routes and explicit catch-all channel cases.
   Parse code rather than comments for shell duplication. Validate imports from the
   canonical navigation module and preserve checks against locally rebuilt menus.
7. Keep denied-access cases for missing, expired and wrong-user sessions, disabled
   feature access and owner-only APIs. These checks must not call providers, send
   notifications, make payments or modify production records.

## Shared-frame source proof

app/(dashboard)/layout.tsx delegates its children to
app/dashboard-layout-frame.tsx and retains force-dynamic/force-no-store.
The frame awaits identity before reading dashboardContext or rendering the
canonical TraderLinkPlatformDashboardTemplate.

The default branch calls requireTraderLinkPlatformServerComponentPageIdentity,
which uses a request-local React cache of requireTraderLinkPlatformRequestIdentity
over nextHeaders. That resolver sets requireDashboardAccess=true, validates the
session, asserts dashboard.access and explicit feature requirements, then derives
the user/workspace/account scope. Membership access participates independently
of Discord evidence; do not accidentally reinstate a mandatory Discord role.

The Watchlist branch uses AuthenticatedPageIdentity with watchlist.access.
Its resolver sets requireDashboardAccess=false and requireDiscordMembership=false
but still resolves authenticated identity and requested feature permissions.
Billing uses the same authenticated resolver without a paid-plan requirement,
which is necessary to let a member enroll. It is not an unauthenticated bypass.
These paths share the canonical template and scoped reads; this proof concerns
frame inheritance, not every page-specific operation.

## Five navigation exceptions and other template failures

- /watchlist is app/watchlist/page.tsx, not inside the route group. Its protected
  content uses WatchlistDashboardFrame -> shared frame with watchlistMemberAccess;
  the separate public preview is deliberate. Test both surfaces distinctly.
- /press-releases/news-filtered is an explicit news-filtered channel case.
- /press-releases/market-cap/under-30m is an explicit market-cap/under-30m case.
- /press-releases/market-cap/30m-50m is an explicit market-cap/30m-50m case.
- /press-releases/market-cap/50m-100m is an explicit market-cap/50m-100m case.

The four channels are handled by app/(dashboard)/press-releases/[[...channel]]/page.tsx,
which checks identity and news access before scoped reads. Unknown channels remain
unavailable. Do not replace catch-all routes with duplicate pages for a test.

The one duplicate-shell match is the explanatory comment in
app/(dashboard)/feature-help-link.tsx. AST inspection should ignore comments,
not exempt all source in that file. Sidebar data now comes from
DASHBOARD_SIDEBAR_NAVIGATION_SECTIONS in the canonical module. The shared-frame
and sidebar assertions are stale; the production layout is not to be rewritten
to satisfy old textual checks.

## Unresolved review boundary

All 115 unclassified API routes and their 135 methods are explicitly listed with
reviewStatus=method_contract_review_required in the JSON. Candidate calls are
triage evidence only; they have not been accepted in bulk. The 42 additional pages
inherit the proven frame but retain page-specific review status. The original
134 overlap entries have only their existing static contract result, not a new
end-to-end authorization certification.

Examples checked beyond call-name inventory: Journal admin reads delegate through
withJournalAdminRequest; both local launcher endpoints deny outside development
before their workers; logout-all resolves the current session after same-origin
validation; daily recap GET/POST both call the local identity helper, which checks
Platform identity plus owner Watchlist access, and POST additionally checks mutation
origin. None of these needs the old V3 owner wrapper solely to satisfy the matrix.

This report proposes the replacement contract and exposes the remaining review
work. It does not declare route QA green or authorize modifying tests, runtime
routes, authentication, navigation, migrations or production state.
