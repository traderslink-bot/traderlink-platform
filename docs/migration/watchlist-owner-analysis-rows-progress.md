# Owner-added analysis rows — 2026-10-21

## Follow-up: automatic price order (owner-authorized release)

Owner now requests automatic highest-to-lowest pullback ordering and renumbering,
not insertion order. Both formats sort whole zones by low price descending, then
high price descending; equal prices retain order and unfinished rows stay last.
Legacy hidden flags are attached to their original rows before sorting. No prices,
explanations, confirmations or visibility settings are synthesized or detached.

The Platform editor sorts on opening and when focus leaves the pullback editing
section, avoiding field jumps or accidentally redirecting clicks while typing.
Manual up/down controls are omitted for pullbacks since price determines order;
target controls remain unchanged. Runtime's alternate editor matches this.
Owner save canonicalizes order; website cards, Premium preview and social images
also sort copies, supporting older unsorted payloads without mutating them.
No AI prompt/schema, target selection, approval or notification change.

Follow-up verification: Platform row suite 8 tests and existing inline editor suite
4 tests pass, including third-added middle zone becoming Pullback 2 in editor,
real Simple-card markup and Premium preview, immutable inputs, incomplete rows,
stable ties and hidden metadata. Bounded semantic check passes. Runtime row suite
9 tests passes including owner saves in both formats, image labels and alternate
browser-editor sorting/syntax. Existing image10 and original-time6 tests pass.
Focused lint/diff checks pass. No live notifications or provider requests.
Coordinator handles final source integration/build and authorized deployment;
hosted completion is not claimed by these local checks.

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
