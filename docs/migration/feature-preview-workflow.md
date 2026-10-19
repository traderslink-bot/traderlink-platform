# Registered Codespaces feature previews

The normal dashboard remains the existing exact-source profile on port 3013.
Feature review uses a separate registered profile, available port, exact commit,
per-port output and disposable database. Port 3015 is always forbidden.

Coordinator tooling:

- `start-platform-preview.sh status` retains normal-dashboard behavior.
- `start-platform-preview.sh --profile login-3033 status` checks the login profile.
- `start-platform-preview.sh --profile login-3033 start` starts it only if safe.

The entry point lives under `/workspaces/traderslink-coordinator/codex-setup/`.
`start-feature-preview.py` reads non-secret JSON registrations from its
`preview-profiles/` directory. Every profile records a worktree, exact full HEAD,
committed server entry, port, origin, readiness path, output and disposable-fixture
file. Registration is explicit; status never changes the source or stops a server.

For the login review worktree, run `node scripts/feature-preview/register-login.cjs
3033` after committing the server entry. Choose another free, unreserved port to
create a different profile. An optional third argument supplies a revision name, for example
`node scripts/feature-preview/register-login.cjs 3034 login-3034-r2`.
Stop only the verified owned preview before registering a source revision on
the same port. Existing registrations are never overwritten. Each
registration initializes a new disposable empty database through the current
migration manifest; it never copies or migrates an existing database. Configuration
and migration metadata are stored outside Git under private-data. Registrations
contain no provider keys or database business contents.

The launcher checks the repository's shared Git identity, exact HEAD, tracked and
untracked runtime source, committed entry, isolated output, approved disposable
fixture, complete ordered migration metadata, port ownership, active builds and
available memory. It does not kill anything or bypass a refusal. Global startup
locking also prevents simultaneous registration starts racing; a live profile
cannot share another profile's disposable database. Source changes require a
reviewed new registration rather than silently changing a running candidate.

`login-server.cjs` serves the actual login screens using Next's development
runtime. Pages compile on demand; it does not execute a production build. Output
and the generated preview TypeScript configuration stay under ignored
`.next-feature-previews/`. The preview config explicitly resolves aliases from the repository root.
The normal app configuration and authentication source
are not rewritten. Real provider keys and sender configuration are disabled;
only public login/static GET/HEAD routes are available. This is a screen-review
preview, not real-provider or signed-member acceptance. Membership editor and
normal dashboard previews remain separate sources.

Validation: Node syntax checks, shell syntax check and six focused refusal tests
in `scripts/feature-preview/test_launcher.py`. After registration, verify actual
HTTP readiness before sharing a preview link. A running PID is not readiness.


## Functional email login profiles

After committing reviewed source, register a fresh fixture and unused port with
`node scripts/feature-preview/register-login.cjs PORT PROFILE --functional`.
Start only through the coordinator launcher with that profile. Codespaces must
provide RESEND_API_KEY and TRADERLINK_LOGIN_EMAIL_FROM. The fixture creates its
own persistent random throttle/outbox key. This permits real email/signup/reset
and persisted member sessions, using the actual application routes. Account
login methods and public plans are available; unrelated dashboard routes remain
blocked. No owner grant, plan entitlement or local-owner bypass is injected.
Google/Discord require their own configured credentials and exact callback
registration on this profile origin; missing providers remain unavailable.
Functional profiles contain no provider secret values. Do not use the existing
screen-only registration for functional tests.
