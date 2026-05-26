# TradersLink Academy Registry Format Decision

Date: 2026-05-18

Status: planning decision

Scope: Choose where the future Academy course registry should live before production website implementation.

This is a planning document only. Do not create production routes, React components, JSX, CSS, Next.js pages, schemas, imported registries, or database tables from this document unless the user explicitly asks for production website implementation.

## Decision

Use author-editable JSON or YAML under:

```text
academy/_data/
```

Recommended first files when implementation is explicitly requested:

```text
academy/_data/courses.json
academy/_data/lesson-memberships.json
academy/_data/path-hubs.json
academy/_data/app-bridges.json
academy/_data/visual-overrides.json
```

This is the best fit for the current repo because the Academy already lives at the repo root:

```text
academy/
academy/candlestick-patterns/
academy/chart-patterns/
academy/sec-filings/
public/academy/images/
```

The future registry should sit beside the Academy markdown content, not inside `docs/content/` and not inside production app code at first.

## Why Not `academy/content/`

Do not use:

```text
academy/content/
```

Reason:

- `academy/` is already the Academy content root.
- Putting content inside `academy/content/` creates a redundant nested content folder.
- It would make lesson paths feel split between `academy/*.md` and `academy/content/*`.
- It would be less clear for editors because the registry would look like a second content system rather than data about the existing Academy content.

The cleaner mental model is:

```text
academy/                 canonical lesson markdown
academy/_data/           author-editable course registry data
public/academy/images/   public Academy image assets
docs/content/            internal planning, audits, trackers, handoff
```

## Why Not Root `/content/academy/`

Do not use root:

```text
content/academy/
```

unless the whole site later adopts a root `content/` convention.

Reason:

- This repo currently has `docs/content/`, but that folder is being used for planning, editorial trackers, SEO queues, audits, and handoff notes.
- Moving Academy registry data into a separate root `content/academy/` would create another content root while the actual lesson markdown remains under `academy/`.
- It would increase confusion between user-facing Academy content and internal content planning files.

If a future site-wide content architecture is created, a root `content/` folder can be reconsidered. For the current Academy work, it is not the cleanest next step.

## Why Not `src/content/academy/` First

Do not start with:

```text
src/content/academy/
```

unless the registry is being implemented as TypeScript app code.

Reason:

- `src/` should be treated as application code.
- TypeScript registry files can give type safety, but they are less editor-friendly than JSON/YAML.
- The user has repeatedly asked to avoid production website implementation during these planning passes.
- A TypeScript registry may be useful later as generated or validated output, but it should not be the first authoring source unless the website build needs it.

Good future use:

```text
src/content/academy/
```

can become a typed adapter layer later if the app needs strongly typed imports.

Recommended relationship:

```text
academy/_data/*.json      editable source registry
src/content/academy/*     optional generated or handwritten typed adapter later
```

## Why `academy/_data/` Is The Best First Choice

`academy/_data/` is the best first choice because:

- It keeps Academy-owned content and Academy-owned registry data together.
- It separates lesson body markdown from course membership data.
- It is easy for non-engineers or future editors to understand.
- It does not turn planning into production app code.
- It can later be read by build-time scripts, a content loader, a CMS migration script, or a TypeScript adapter.
- It makes cross-listed lesson membership explicit without duplicating markdown.
- It preserves the clean public URL mental model: `/academy/...`.

## Recommended Data Format

Use JSON first unless a future editor workflow strongly prefers YAML.

Recommended:

```text
academy/_data/courses.json
academy/_data/lesson-memberships.json
academy/_data/path-hubs.json
academy/_data/app-bridges.json
academy/_data/visual-overrides.json
```

Why JSON first:

- Native JavaScript/Node support.
- Easy validation.
- Easier future import into TypeScript.
- Less ambiguity than YAML around quoting and indentation.
- Good fit for generated checks.

YAML is acceptable if human editing comfort becomes more important than tooling simplicity.

## Recommended Future File Roles

| File | Purpose |
|---|---|
| `academy/_data/courses.json` | Course definitions, order, titles, outcomes, status, progress behavior, visual status, and recommended next course. |
| `academy/_data/lesson-memberships.json` | Course/module lesson rows, displayed order, canonical versus cross-listed membership, required/supporting behavior, and context navigation. |
| `academy/_data/path-hubs.json` | Optional guided path hubs, path steps, path goals, and aggregate progress behavior. |
| `academy/_data/app-bridges.json` | Route-safe app bridge metadata with hard app links disabled until product routes and claims are stable. |
| `academy/_data/visual-overrides.json` | Course card/module card visual choices, only referencing assets that already exist. |

## Authoring Model

Recommended source-of-truth split:

| Layer | Location | Source Of Truth For |
|---|---|---|
| Lesson markdown | `academy/*.md`, `academy/*/*.md` | Lesson body, title, slug, objective, educational examples, FAQ, disclaimer, related lessons, visual references. |
| Registry data | `academy/_data/*.json` | Course order, module order, cross-listed membership, required/supporting behavior, course-context navigation, path hub steps, route-safe bridge candidates. |
| Planning docs | `docs/content/*.md` | Audits, decisions, handoff, tracker, planning rationale. |
| Public static assets | `public/academy/images/...` | SVGs and images served by the website. |
| Optional typed adapter | `src/content/academy/*` | Future app-facing types, loaders, validation helpers, or generated exports if needed. |

## Route Mental Model

Filesystem location and public URL are related but not identical.

The public Academy URL should be:

```text
https://traderslink.pro/academy/
```

That does not require every related source file to live under a public route folder.

Recommended mental model:

```text
academy/support-and-resistance.md
```

can become:

```text
/academy/support-and-resistance/
```

and:

```text
public/academy/images/chart-reading/support-level-hold.svg
```

can be served as:

```text
/academy/images/chart-reading/support-level-hold.svg
```

The registry data:

```text
academy/_data/courses.json
```

should not become a public URL. It is source data for the future website build.

## Implementation Boundary

Do not create `academy/_data/` files yet unless the user explicitly asks to move from planning into registry drafting or implementation.

Before creating machine-readable registry files:

- Confirm JSON versus YAML.
- Decide whether to include every lesson row in one `lesson-memberships.json` file or split by course.
- Add validation checks that every lesson slug resolves to a local markdown file.
- Add validation checks that every image reference resolves to a local file.
- Keep hard app links disabled.
- Keep user-facing lessons citation-free unless sources are part of the topic itself.
- Read relevant current Next.js docs under `node_modules/next/dist/docs/` before production website implementation.

## Recommended Next Action

Next recommended run:

```text
Create an author-editable Academy registry draft under academy/_data/ as JSON only if the user explicitly approves moving from planning docs into machine-readable registry files.
```

If the user wants to keep planning first, the next no-code step is:

```text
Create a registry migration checklist from docs/content/traderslink-academy-content-registry-draft.md to academy/_data/*.json.
```
