# Next.js Local Docs Guide

**Last checked:** 2026-05-20

## Purpose

`AGENTS.md` says to read the relevant local Next.js guide before writing Next.js
code. This file records how to do that in this project so future Codex runs do
not lose time wondering whether the docs are available.

## Current Local Docs State

The installed Next.js package currently includes local docs here:

- `node_modules/next/dist/docs/`

The installed package version checked during this note was:

- `next@16.2.3`

Important: if a future run says this path is missing, verify the current working
directory and dependency install first. In this checkout and the current Academy
launch worktree, the path exists.

## How Future Codex Should Use It

Before editing App Router, route, layout, metadata, caching, middleware/proxy,
or server/client component behavior, read the relevant local docs under:

- `node_modules/next/dist/docs/index.md`
- `node_modules/next/dist/docs/01-app/`
- `node_modules/next/dist/docs/03-architecture/`

Use the local docs for installed-version behavior. Use the Vercel/Next.js skill
or official Next.js docs only when the local docs are missing, incomplete, or a
current behavior needs confirmation.

## If The Path Is Missing Later

Do not create fake Next.js framework docs inside this repo.

Instead:

1. Confirm the repo root is `trader-intelligence-v2` or the active launch
   worktree `trader-intelligence-v2-svg-qa`.
2. Confirm dependencies are installed.
3. Check `node_modules/next/package.json` for the installed version.
4. Use installed TypeScript definitions and the Vercel/Next.js skill as the
   fallback source of truth.
5. Record the finding in `src/docs/codex-project-log.md` if it affects a work
   session.

## Relationship To The Product Plans

This file is an implementation-safety note only. It does not replace the product
planning chain:

- `plan.md`
- `src/docs/trader-intelligence-plan-index.md`
- the active detailed plan named in the index
- the active next-run execution plan named in the index
