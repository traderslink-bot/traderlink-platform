# Official watchlist render correction — October 2

Status: source corrected; staging verification pending.

Full QA found that a published official watchlist detail page crashed for its
owner. Coordinator confirmed the staging RSC serialization error. The server page
passed Next Link as the MUI Button component prop. Replace that function prop with
the native anchor string and retain the same href, icon, label and styling. No
data, permission, publishing or layout changes are included.

Allowlist: this record and
`app/(dashboard)/communities/[communitySlug]/server-watchlists/[watchlistId]/page.tsx`.
Targeted ESLint and git diff --check pass. No resource-heavy local build was run.
Help documentation needs no change: this restores an existing navigation behavior.
Coordinator owns clean integration on staging parent 9d5d1be839e624377c960b7d0a64f725ac0879ad.
Production is not in scope. After deployment, verify owner detail/edit/back-link
and member permission handling against the already published synthetic watchlist.
