<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->
## Codex Autonomy Rules

- Continue with the highest-value next implementation step unless blocked by meaningful ambiguity, architectural risk, or a destructive operation.
- After completing meaningful work, run the relevant tests and verification commands before closing out the task.
- Keep `src/docs/codex-project-log.md` updated when the current resume point, roadmap branch, or best next step changes materially.
- Prefer continuing the current roadmap branch before starting a new pattern family or broader refactor.
- Use `src/docs/behavior-coverage-audit.md` and `src/docs/layer2-pattern-detection/layer2-implemented-pattern-catalog.md` as the main calibration docs for deciding what to build next.
- Only pause for user confirmation when a choice would materially affect architecture, contracts, safety, or destructive filesystem or git actions.
- When resuming cold, first read `src/docs/codex-project-log.md`, then consult the behavior audit and pattern catalog before making new roadmap decisions.

## Academy Progress Preservation

- Academy progress is production user data. Do not reset, truncate, recreate, or switch the production progress database unless the user explicitly asks for a migration.
- Live Academy progress is keyed by lesson slug. Do not rename, delete, or move launch lesson slugs without updating `academy/_data/progress-slug-baseline.json` and adding an alias in `academy/_data/progress-slug-aliases.json`.
- Run `npm run validate:academy-registry` before deploying Academy content or route changes; it is expected to fail if a protected live slug disappears without an alias.
- See `docs/academy-progress-preservation.md` before changing Academy routing, lesson slugs, progress storage, or Vercel database environment variables.

## Whole Site Source Of Truth

- Treat this repo/worktree as the full TradersLink website only when Git HEAD matches the intended production deployment. On 2026-05-25, production Vercel deployment `dpl_5kdq544VSxoobgEsy1ftv52VVYfD` points at commit `81e175909c6f0ad68481fbfc800259c32485251d` on `codex/news-on-live-academy`.
- The Vercel project is `vercel-landing` (`prj_TFzKcdj4dS6BHv2maWsy7M5AEv2a`) with production aliases `traderslink.pro` and `www.traderslink.pro`.
- The shared top navigation lives in `src/components/site/site-shell.tsx` and is re-exported by `app/site-shell.tsx`. Do not create separate Academy, News, or Intelligence topbars.
- Canonical feature roots are `app/academy`, `app/news`, and `app/intelligence`. Former workspace routes should redirect in `next.config.ts`; do not recreate duplicate top-level app pages for them.
- Read `docs/site-architecture.md`, `docs/routes.md`, `docs/deployment.md`, and `docs/auth.md` before structural, deployment, route, or auth changes.
