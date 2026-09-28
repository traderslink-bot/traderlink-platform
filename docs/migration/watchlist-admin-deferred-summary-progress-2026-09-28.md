# Watchlist Admin deferred summaries — 2026-09-28

Status: bounded owner-authorized correction prepared; source checks complete; deployment and live acceptance pending. Exact parent f36dbefdaa49f34c2c5267db1888cdcea2b4c067.

## Evidence and approved scope

Coordinator reported a production burst with /admin/watchlist at 20,291 ms, root redirect 17,179 ms, halt cron 7–9 seconds and static assets delayed. Exact attribution is not established by these totals. Source inspection proves default Admin Watchlist eagerly computed usage across all recorded visits and recap storage sizes across all evidence/draft/composition text, even when their sections were never selected.

Owner, through the release Coordinator, directed removing those readers from initial page render and loading each heavy summary only on its section's selection. Preserve all data, calculations, page shell and owner authorization. Do not modify cron, push, providers, databases, migrations or non-admin behavior.

## Implementation complete

- Initial page retains its identity/navigation authorization and shell, with no Usage or Daily Recaps reader calls.
- First Usage selection mounts a loader and calls a new authorized private/no-store GET endpoint using the unchanged usage reader.
- First Daily Recaps selection mounts a loader and calls the existing authorized daily-recaps GET endpoint for the current New York date, with all existing snapshot fields.
- Both iframe navigation messages and visible tab buttons trigger the same section selection. Panels remain mounted when hidden after their first opening, preserving unsaved drafts while switching tabs.
- Loading Usage… and Loading Daily Recaps… are shown during loading; bounded 20-second fetches show a retry action on failure. Unmount cancels requests and suppresses late updates.
- Existing recap mutations, calculations, stored-data cleanup control, runtime iframe, analysis editing and notifications are unchanged. Full-history readers still run if the owner explicitly opens the relevant section; this is not a claim that their cost has been eliminated everywhere.
- Help Center reviewed: its existing instruction to open Admin Watchlist and select Daily Recaps remains correct. No guide change required.

## Smallest source checks

Four source candidates passed TypeScript transpilation/syntax and targeted ESLint without errors or warnings. Bounded source proof found zero Usage/Recaps reader references in the page; default section is runtime; both panels start unmounted; their respective button/message handlers enable first mount; loader endpoints are section-specific; Usage authorization precedes its read. This proves source routing, not a hosted timing reduction or full type/build correctness. No Vitest, broad tests, production build, load test or database query was run.

Mixed canonical source, actual Git index and HEAD remain untouched. Candidate files are exact-parent source in temporary storage, frozen with a temporary index. Immutable metadata and patch: qa-evidence/watchlist-admin-deferred-summary-20260928.json and matching .patch.

## Release acceptance remaining

Coordinator must validate exact-parent integration/build and deploy through its release slot. Live default /admin/watchlist must make no Usage/Recaps request; first selection must load the correct section; switching away/back must retain entered recap text and avoid remount/refetch. Unauthorized usage GET must deny access. Measure navigation and shared-route responsiveness during normal traffic. Do not call the 17–20 second incident fully resolved without evidence.
