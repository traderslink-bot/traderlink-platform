# TradersLink Academy Production Route And Content Loader Plan

Date: 2026-05-18

Status: first production slice implemented and verified

Scope: `/academy` route architecture, content loading, registry imports, lesson rendering, metadata, path hubs, progress placeholders, and app bridge safety.

## Local Next.js Docs Reviewed

Per repo instructions, this plan is based on the installed Next.js docs in `node_modules/next/dist/docs/`.

Reviewed:

- `01-app/01-getting-started/02-project-structure.md`
- `01-app/01-getting-started/03-layouts-and-pages.md`
- `01-app/01-getting-started/05-server-and-client-components.md`
- `01-app/01-getting-started/06-fetching-data.md`
- `01-app/01-getting-started/08-caching.md`
- `01-app/01-getting-started/12-images.md`
- `01-app/01-getting-started/14-metadata-and-og-images.md`
- `01-app/03-api-reference/03-file-conventions/dynamic-routes.md`
- `01-app/03-api-reference/03-file-conventions/public-folder.md`
- `01-app/03-api-reference/03-file-conventions/not-found.md`
- `01-app/03-api-reference/04-functions/generate-static-params.md`
- `01-app/03-api-reference/04-functions/generate-metadata.md`

Key current-version implications:

- App Router routes come from folders and `page.tsx` files.
- Pages and layouts are Server Components by default.
- Dynamic `params` are promises and should be awaited.
- `generateStaticParams` should provide lesson/path/course params from registry data.
- `generateMetadata` is Server Component only and should derive title/description from registry/markdown.
- Static files under `public` are referenced from the base URL, so `public/academy/images/...` becomes `/academy/images/...`.
- `notFound()` should be used for invalid course/path/lesson params.
- Browser-only progress state should live in a small Client Component later, not in the server content loader.

## Route Architecture

Initial production route set:

```text
app/academy/page.tsx
app/academy/courses/[courseId]/page.tsx
app/academy/paths/[pathId]/page.tsx
app/academy/[...slug]/page.tsx
app/academy/not-found.tsx
```

Reason:

- `/academy` is the learning dashboard.
- `/academy/courses/[courseId]` is a stable internal course page URL independent of lesson slugs.
- `/academy/paths/[pathId]` is for optional guided path hubs.
- `/academy/[...slug]` supports existing public lesson URLs such as `/academy/support-and-resistance/`, `/academy/sec-filings/form-8-k/`, and `/academy/chart-patterns/bull-flag/`.
- Specific routes like `/academy/courses/...` and `/academy/paths/...` stay separate from lesson slugs.

Do not create duplicate content pages for cross-listed lessons. A lesson slug remains canonical and course context comes from registry membership.

## Content Loader Architecture

Create a server-only content loader:

```text
src/lib/academy/academy-content.ts
```

Responsibilities:

- Import registry JSON from `academy/_data/`.
- Load markdown from `academy/`.
- Parse frontmatter enough to get title, description, lesson metadata, and visual references.
- Build lesson summaries.
- Build course pages from course/module/membership rows.
- Build path hub pages from path hub data.
- Resolve previous/next context links.
- Return `null` when a course, path, or lesson is missing.

Avoid client-side registry loading.

## Rendering Model

Use Server Components for the first implementation.

Client Components should be added later only for:

- Mark lesson complete.
- Local progress state.
- Authenticated progress sync.
- Expand/collapse modules if needed.
- Course filters/search if needed.

Initial pages can be static, crawlable, and SEO-friendly.

## Metadata Model

Use:

```text
generateMetadata
```

for:

- Course pages.
- Path hub pages.
- Lesson pages.

Metadata source order:

1. Markdown frontmatter title/description when present.
2. Registry title/outcome when present.
3. Plain fallback from slug/course title.

Default suffix:

```text
| TradersLink Academy
```

Keep user-facing lesson pages citation-free by default.

## Static Params

Use:

```text
generateStaticParams
```

for:

- Course IDs from `courses.json`.
- Path IDs from `path-hubs.json`.
- Lesson slug segments from `lesson-memberships.json` plus path hub slugs.

This lets the build validate known Academy routes.

## Progress Model

First implementation:

- Show progress-ready placeholders such as lesson counts and module counts.
- Do not persist completion yet.
- Do not create database tables yet.
- Do not claim the app tracks progress until a real progress store exists.

Later implementation:

- Anonymous local progress can use browser storage.
- Authenticated progress should use database-backed completion keyed by lesson slug.
- Cross-listed lesson completion should count once by slug.

## App Bridge Model

Use registry app bridge data as a source of restrained copy only.

Current rule:

```text
hard_link_enabled: false
route_key: null
```

No hard app links should be rendered until product route keys, feature names, and claims are stable.

## Visual Model

Use markdown image references and public asset paths.

For static assets:

```text
public/academy/images/chart-reading/example.svg
```

renders as:

```text
/academy/images/chart-reading/example.svg
```

Do not render planned launch-polish assets until the files exist.

## First Build Slice

Implemented first slice:

- Added `src/lib/academy/academy-content.ts`.
- Added `src/lib/academy/academy-markdown.tsx`.
- Added `app/academy/page.tsx`.
- Added `app/academy/courses/[courseId]/page.tsx`.
- Added `app/academy/paths/[pathId]/page.tsx`.
- Added `app/academy/[...slug]/page.tsx`.
- Added `app/academy/not-found.tsx`.
- Added route metadata and static params.
- Added no progress persistence.
- Added no hard app links.
- Added no production database changes.

## Verification

Completed checks:

```text
npm run validate:academy-registry - passed
npx tsc --noEmit --pretty false - passed
npm run build - passed
```

Production server browser verification passed on `http://127.0.0.1:3102`:

```text
/academy - loaded
/academy/courses/chart-reading-market-structure - loaded
/academy/support-and-resistance - loaded
```

Browser console error count during the production verification: `0`.

## Second Build Slice

Implemented after the first route/content-loader slice:

- Added local-only lesson completion controls backed by browser storage.
- Added local-only course progress summaries based on required lesson slugs.
- Added per-lesson status badges on course pages.
- Added learner-first bottom navigation on lesson pages with obvious previous and next lesson actions.
- Added a secondary scrollable course lesson list in the lesson sidebar.
- Added course/module context links on lesson pages.
- Improved markdown rendering for long tables, horizontal rules, and indented list content.
- Added focused Vitest coverage for the Academy content loader, static params, nested lesson slugs, path hubs, and app bridge hard-link guardrails.

Second-slice verification:

```text
npm run validate:academy-registry - passed
npx vitest run src/lib/academy/__tests__/academy-content.test.ts - passed
npx eslint app/academy src/lib/academy - passed
npx tsc --noEmit --pretty false - passed
npm run build - passed
```

Browser verification on `http://127.0.0.1:3102/academy/support-and-resistance` confirmed:

- Lesson progress card visible.
- Course context and view-course link visible.
- Course lesson sidebar visible.
- Previous and next lesson navigation visible at the bottom of the lesson.
- Browser console error count: `0`.

## Next Recommended Action

Build the next Academy production slice:

- Add a persistent top/bottom course progress rail that remains subtle on desktop and collapses cleanly on mobile.
- Add an Academy landing-page polish pass for path choice and resume-state messaging.
- Add click-level UI tests for marking lessons complete once the preferred browser automation path is stable.
