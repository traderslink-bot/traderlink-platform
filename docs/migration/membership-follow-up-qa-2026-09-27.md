# Membership follow-up QA

Status: Finding fixed and focused QA rerun complete. Payment integration remains separate.

## Discord partial outage clears roles

The actual Discord membership resolver was probed with mocked member HTTP 503
and a successful guild list containing the member's server. It returned
`{ joined_at: null }`. The OAuth callback then converts missing roles to `[]`
and writes a fresh verification timestamp. This can remove role-based plan
access during a temporary outage. Existing outage coverage fails both endpoints
and misses this case.

Correction completed after owner authorization: a member lookup error is now
propagated when the fallback list confirms the server. The callback's existing
per-server failure boundary retains the previous snapshot without refreshing it.
Confirmed absence and successful role removal still follow their existing paths.
No new plan, role or owner-control restrictions were introduced.

## Fresh verification

- Foundation verifier passed (19 membership tables and grant/link boundaries).
- Signed-request access verifier passed.
- Expanded actual callback verifier passed with mocked Discord: partial outage,
  unchanged roles and verification timestamp, original expiry, other-server
  refresh, successful role removal after recovery, and confirmed departure.
- Migration verifier passed (131 migrations, zero foreign-key violations).
- Focused TypeScript passed: 115 entrypoints, zero diagnostics.
- Exact-file ESLint and tracked-source whitespace checks passed.
- Synthetic/in-memory data only; no live payments, production migration or member changes.
- No fresh browser pass, build or broad test suite. Prior browser evidence is historical.

No new findings in this focused rerun. Help review: the membership guide already
requires current Discord verification; no copy change is needed to restore that
behavior. Next.js route-handler guidance was reviewed; no route contract or UI
change was necessary. The source and regression changes remain local in the shared
mixed working tree; no unrelated edits were staged, committed or published.
