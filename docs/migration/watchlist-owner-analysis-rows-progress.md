# Owner-added analysis rows — 2026-10-21

## Scope and implementation

Owner request: remove arbitrary row-count caps on manually edited potential targets
and pullbacks, and label pullbacks `Pullback 1`, `Pullback 2`, etc. This is not an
instruction to ask AI for more rows. Expected use is usually two or three pullbacks.

Implemented in assigned Platform lane `admin-watchlist-current`, initial parent
`6629700b98b3b35dd10f39d5f71dbc9690dfc40a`, and assigned Runtime lane
`watchlist-runtime`. Preserve Runtime's separately deployed Discord-heading hunks.

- Simple saved-content parsers accept variable target and pullback arrays.
- Detailed reads accept an additive optional `ownerPullbacks` array. Absence uses
  the legacy AI pair; an explicit empty array intentionally shows no pullbacks.
- Both owner editors support added rows without a count cap. Platform supports
  insert/move controls; each pullback carries its own Show setting when moved.
- Legacy shallow/deep visibility migrates into row visibility on editing.
- Public cards, Premium previews, live-volume commentary and image projections
  use the ordered owner list and numbered names. Hidden rows do not leak content.
- Original generation evidence remains unchanged; edited rows clear AI evidence
  references. Saving remains separate from approval, publication and notification.
- Detailed target boundary inputs already use all targets. No boundary semantics,
  generation prompts/schema, refresh behavior or approval restrictions changed.
- No database migration: optional fields live within the existing versioned JSON.
- Existing text/request-size and image-readability safeguards remain. A very large
  list is not truncated in saved or website content; existing image-generation
  failure preserves the normal linked post. Three pullbacks render successfully.

## Verification

Platform:

```
node src/lib/live-watchlist/__tests__/owner-analysis-rows.node-test.cjs
node src/lib/live-watchlist/__tests__/analysis-inline-edit.node-test.cjs
node src/lib/live-watchlist/__tests__/owner-analysis-rows.node-check.cjs
```

Passed 6 new regression tests, 4 existing editor tests and bounded semantic check
of real models/parser/editor/Simple card. Only the large dynamically imported
public page is isolated in that semantic check; its declared props match current
source. Tests cover 75 targets/12 pullbacks, insert/move/sort, legacy visibility,
empty overrides, Premium concealment and actual Simple-card server rendering.

Targeted ESLint passed without errors; one pre-existing unused helper warning in
the public page (`cleanLevelMapCardBody`). `git diff --check` passed.
Full-app TypeScript verification was attempted but aborted at Node's default
approximately 2 GiB heap ceiling; it is **not** recorded as passed. The older
bounded inline-types harness also has outdated public-page stubs and unrelated
missing declarations; the new focused semantic harness passed instead.

Runtime (reuse installed dependencies read-only, no installation):

```
NODE_PATH=/home/traderlink/projects/admin-watchlist-current/node_modules node --import /home/traderlink/projects/admin-watchlist/node_modules/tsx/dist/loader.mjs src/tests/watchlist-owner-analysis-rows.test.ts
NODE_PATH=/home/traderlink/projects/admin-watchlist-current/node_modules node --import /home/traderlink/projects/admin-watchlist/node_modules/tsx/dist/loader.mjs src/tests/watchlist-analysis-image.test.ts
```

Passed 7 new tests and 10 existing image tests. Includes temporary audit-store
original/edit/approval/restart preservation and real PNG generation for three
pullbacks in both formats. Fontconfig emitted cache-writability warnings, but
PNG generation succeeded. Existing Discord tests use mocked fetch only.
Runtime review-panel embedded JavaScript syntax passed. AI maxItems schema was
checked unchanged. No services, market APIs, settings or real messages touched.

React checklist reviewed: controlled fields, row visibility moves with data,
numbered fieldset legends, no new effects or per-row network requests, existing
component/library conventions retained. Help owner-editing instructions updated.

## Handoff boundary

Implementation/focused offline checks complete. No deployment, live-data change
or owner visual acceptance claimed. Coordinator owns source preservation and
integration. Exclude AGENTS environment overlay and pre-existing Runtime heading
changes from the feature slice. User has not requested deployment for this slice.
