# Actual crash-process launcher repair — 2026-11-17

The combined domain regression had four crash-test failures with child exit1
instead of the intentional exit42. Direct child reproduction against combined
`f543f8acaf59f56bc0d9d87f8f8bbde24eed3c33` showed MODULE_NOT_FOUND for
`server-only` through public-origin/auth/admin/admission/Paid recovery/history.
The raw tsx launcher does not inherit Vitest's marker alias. Merely selecting
Node's react-server condition does not resolve the absent standalone package.

The repaired launcher bundles the actual child code using the production
erasure worker's esbuild conditions and the official Next server-only empty
marker. It never mocks history, recovery, SQLite, filesystem or providers. The
real native driver remains external. Bundled code is fed over stdin to a real
CommonJS child module, preserving argument indexes and avoiding Linux argument
size limits and collision with Node's global Web Crypto name.

All four original process.exit42 boundaries and every WAL/file/restart assertion
are retained. Unexpected exit assertions now include actual stderr/spawn errors.
Four cases pass against the actual combined runtime source using a temporary
external test carrier under `/tmp/core-erasure-restart-review-20261117-osokpo12`.
The carrier changes only parent import paths and source-root working directory;
no combined runtime or test files were overwritten. Initial direct -e bundle
transport hit E2BIG; an eval transport then hit the global crypto collision.
The final CommonJS stdin transport passes. Targeted lint/diff checks also pass.

Coordinator's required Next ProcessEnv NODE_ENV fixture correction is mirrored
in this lane's guard tests, preserving the already integrated root correction.
No runtime source behavior changed in this slice. Hosted staging, final catalog
qualification and full combined workflow acceptance remain outstanding.
