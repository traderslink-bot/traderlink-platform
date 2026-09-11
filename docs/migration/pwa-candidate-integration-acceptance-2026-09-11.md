# PWA candidate integration acceptance — September 11, 2026

Candidate: `0a428d8347817b6f18189f481eca5f34e571cc21`, parent `bf259359db24d163e12f91cee224e707e813d7c3`. Scope: 25 PWA code files plus three request-timing files. This record concerns that exact immutable candidate, not the dirty working tree.

## Source acceptance

- All four reconciled conflict files reviewed. Delivery retains deployed TTL/urgency and adds bounded socket inactivity handling. Halt claims retain halt ID, stage/revision tag, 120-second TTL, high urgency and stale expiration. Press releases retain 86400-second TTL/high urgency. Help retains Preferences naming and Daily Recaps.
- Explicit update dependency is present as a unit: `skipWaiting:false`, activate-update service-worker message handler, waiting-worker UI and lifecycle mount. No automatic form-discarding reload. Actual multi-tab/installed-worker upgrade still requires runtime acceptance.
- User-facing delivery history is absent. Status and test requests do not load recent delivery history. Alert choices, setup/restore warnings and optional test remain.
- `node scripts/pwa-reliability-check.cjs 0a428d8347817b6f18189f481eca5f34e571cc21`: all 11 isolated checks pass using source read directly from Git and synthetic in-memory SQLite. Candidate-specific assertions include halt stage/revision identity and both news TTL/urgency contracts. No real database, push send or Journal mutation.
- `node --max-old-space-size=768 scripts/pwa-candidate-typecheck.cjs 0a428d8347817b6f18189f481eca5f34e571cc21`: zero diagnostics, 26 changed TypeScript entry points, 391 Git-backed source files. Virtual host supplies candidate files and directories; installed dependency declarations come from local node_modules. Library targets match candidate ES2017 plus DOM/DOM iterable/ESNext/WebWorker. Initial harness missing-directory/library-target diagnostics were corrected before this accepted run; they were not product findings. This is a focused semantic dependency check, not a full application build. The service worker was excluded from this program; its syntax and extracted notification-click behavior were separately checked.
- Coordinator reports all 28 code files transpile and pass diff checks, canonical index unchanged, no migration/schema definitions changed, production healthy with exact 119 migration registry. Those are coordinator-reported gates, not a new production mutation by this task.

## Release and runtime boundary

Source integration accepted for the candidate above. No explicit owner production-publish instruction was present in this conversation; the coordinator was told to complete preparation/read-only gates without publishing. A concrete production release decision remains with the owner after coordinator completes remaining release checks. No full build, physical Android receipt, locked/background latency, native multi-context offline trade sync or installed-worker upgrade pass is claimed.

Website timing instrumentation is ready for a narrow authorized deployment to collect actual request-phase/full-verifier evidence. No database validation policy was weakened and no server-speed improvement is claimed from instrumentation alone. See [website timing progress](website-performance-timing-progress-2026-09-11.md) and [PWA repair progress](pwa-reliability-repair-progress-2026-09-11.md).
