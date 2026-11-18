# Community account erasure qualification candidate

The installed Paid schema selects participant admission for every full-account
deletion. Ordinary actors with zero Paid facts are affected. This is selected
before an acceptance receipt, independently of flags, and precedes the service's
Stripe-binding check. Skipping a target because it appears empty would change
that admission contract.

A new isolated 193-entry schema reproduced the refusal for both a zero-data actor
and an actual seller, preserving users/workspaces and writing zero erasure
history. Its native schema digest was
`26422558d5ad7706a7bfd3d991aa4e9dd0c2945a98eb5bd4819bb2ed7a822622`.
This reproducer establishes the existing global gate. It does not qualify the
future combined migration vector.

The Core repair adds explicit deletion-command lifecycle onboarding. A current
signed worker release selects `erasureProfileRef`. Core validates the exact
account command, session, workspace and sole ownership under an immediate writer,
then creates the lifecycle and its existing `onboarded` event. This creates no
Premium or Membership authority. Existing expired, held or mismatched lifecycles
require their explicit transition. Pending operations keep their existing retry
protocol and must match the selected signed profile. The worker rechecks its
signed release and test-guild configuration before onboarding.

Sixteen focused unit tests passed for guild/proof restrictions and bootstrap
selection. An actual Core SQL harness with a synthetic reviewed catalog verified
new lifecycle admission, forged-workspace rejection, no Premium authority,
idempotence, unknown-profile rejection and refusal to revive expired/held
lifecycles, for both actor types. The harness redirects only its fixture manifest
in memory and never changes a registered runtime manifest. Its generated signing
and review material grants no release authority.

## Current native observation

Run `scripts/qa/prepare-community-erasure-qualification.cjs` with `tsx/cjs` from
the selected source root, passing that root and a new private output directory.
The tool initializes a synthetic database using that source's actual manifest,
runs the completed native verifier and foreign-key check, records every applied
migration, hashes the scoped source vector and rejects a concurrent source
change. It writes only UNQUALIFIED catalog/profile candidates and evidence.

Observation `/tmp/community-erasure-qualification-20261117.YMOwkd` from the actual
combined checkout (source with pending integration changes at the latest observation boundary) has 183 registered migrations and schema
`e834784e4455ea2522339bc49b45172a388df4be4ae3af7a36a41500e699c94c`.
It is dirty and all required Core/Paid lifecycle and Stripe tables are absent.
The candidate therefore remains unusable for runtime admission, with expiry
unset. Re-run against the frozen append-only combined manifest before review.
The 193-entry evidence is a historical fixture and is not substituted for this
observation.

## Required release inputs

1. Freeze the combined source, including all guards, Core repair and Paid reader.
   Record its commit and per-file hash vector. Assign canonical append orders and
   verify the complete physical SQL schema, managed tables and migration ledger
   using the actual native driver. Update the worker's exact signed release
   format for this vector. Older signed formats must retain their exact scope.
2. Obtain independent source/schema/policy acceptance naming the frozen vector,
   observed schema, retention and restore policies, reviewer, receipt, review
   time and bounded validity. Only then populate the catalog's review fields and
   `catalogContentSha256`. Keep the catalog byte hash as
   `PARTNER_ALERT_ERASURE_PROFILE_CATALOG_SHA256`.
3. Select the reviewed `erasureProfileRef` in the signed release input. Install
   its exact schema/policy references, bounded expiry and expected generation
   through the existing admitted owner profile installer. Installation and
   per-command lifecycle onboarding are separate writes. The candidate profile
   reference is `community_account_erasure_v1`, pending review.
4. Provision distinct Ed25519 authorities. The independent release reviewer
   produces `PARTNER_ALERT_STRIPE_ERASURE_REVIEW_PATH`, verified through
   `PARTNER_ALERT_STRIPE_ERASURE_REVIEW_PUBLIC_KEY`. The independent backup
   inventory producer supplies `PARTNER_ALERT_STRIPE_ERASURE_BACKUP_PATH` and
   `PARTNER_ALERT_STRIPE_ERASURE_BACKUP_PUBLIC_KEY`. The worker owns
   `PARTNER_ALERT_STRIPE_ERASURE_ROLE_PRIVATE_KEY` for current role-disposition
   receipts. Release, backup and role keys must be distinct. Private key bytes
   belong in protected hosted configuration, never source or evidence logs.
5. Provision a pinned tombstone ledger at
   `PARTNER_ALERT_STRIPE_ERASURE_TOMBSTONE_PATH`, with
   `PARTNER_ALERT_STRIPE_ERASURE_LEDGER_KEY_REF` and
   `PARTNER_ALERT_STRIPE_ERASURE_LEDGER_KEY`. Separately provision
   `PARTNER_ALERT_STRIPE_ERASURE_BINDING_KEY_REF` and
   `PARTNER_ALERT_STRIPE_ERASURE_BINDING_KEY` for subject/successor binding.
   Sign the exact ledger location, key references and key digests in the release
   review. Inventory must cover actual retained snapshots and backup horizon.
6. For provider-capable operation, bind only approved source/destination channel
   and role identities under `1559172784813514803`, exact bot identity/output
   registry, protected ordinary and complimentary Premium roles and their
   credential/output fingerprints. No identity may be invented to fill a
   required field. The existing reader requires
   `PARTNER_ALERT_STRIPE_ERASURE_ENABLED=true` and a complete signed input.
7. Before admitting readiness on the new schema, verify the configured worker
   release against a fresh dedicated database connection and close it. This
   checks schema/catalog/profile and signed authorities without running a delete
   or contacting Discord. Missing or stale review must prevent activation of the
   schema release, rather than exposing a healthy app with all account deletions
   refused. Coordinator owns this startup and release check.

The successor reader and Core must agree on the exact selected-profile field and
full-ledger/schema/catalog/native-source binding. Paid is independently reviewing
that contract. Existing historical keys and synthetic catalogs cannot satisfy it.

## Empty transport configuration

An absent registry, key, catalog or profile continues to refuse erasure
admission. Flags cannot manufacture trust. If the reviewed release has no actual
Discord bindings, a separately signed `no_discord_effects` mode is being reviewed
with Paid. It must still qualify the complete Core schema, catalog, selected
profile, inventory and tombstones. It may produce a zero-entry disposition only
after proving the actor has no affected role scopes on the admitted connection.
Every nonempty role scope must hold before provider work or deletion. Until that
mode's implementation and independent review are complete, the current reader
continues to require its full provider configuration.

## Final acceptance still required

After frozen source and accepted real artifacts exist, verify actual worker
full-account deletion for a new ordinary actor without a pre-existing lifecycle,
plus buyer and held seller behavior, sessions/cookies/history/file cleanup,
wrong/stale reviews, retries and signed quarantined restore with zero replay
Discord calls. Use synthetic accounts and transport in isolated data. No
production deletion is part of qualification. The old production release remains
the serving source until the Coordinator completes these gates.


## Exact signed v5 payload and empty mode

Paid independently reviewed the current Core onboarding and bootstrap source on
November 17. Its read-only review found no blocker in transaction/auth ordering,
profile selection, nonrenewal of held/expired lifecycles, pending retry handling
or absence of Premium authority creation. This is source review of the draft,
separate from the final combined schema/catalog qualification.

The proposed release payload has exactly 25 array fields. It preserves v4's
fields 1 through 22, changes field 0 to
`traderlink:paid-stripe-erasure-release:v5`, and appends signed
`erasureProfileRef` and `effectMode` at fields 23 and 24. The mode is exactly
`discord_roles` or `no_discord_effects`. Only v5 returns `releaseFormat: "v5"`.
Core v5 compares every applied migration against the current canonical manifest,
requires exact count and full signed ledger digest, and checks all four signed
Paid component descriptor checksums. Formats v1 through v4 retain their prior
fixed vectors.

For signed `no_discord_effects`, bot ID and output reference are null, the output
registry digest is SHA256 of JSON `[]`, protected roles are `[]`, and the
configuration reader returns null. No bot credential or invented binding is
required. A nonnull configuration in this mode is rejected. The provider-capable
mode requires a configuration. The existing native runtime may issue an empty
role disposition only from fresh empty affected-role facts under the current
root fence. Any actual role scope remains held without qualified transport.
Global Membership configuration does not select this mode.

The actual combined dependency set for final verification is BetterSQLite
12.9.0 with SQLite 3.53.0. The isolated lifecycle/binding harness has been rerun
against that driver. The older 193 schema is only its regression fixture. The
native evidence tool records the actual driver and SQLite versions on each
future observation.

The canonical append reservation is recorded by Coordinator in
`operations/community-canonical-append-reservation-20261117.json`.
All final descriptor orders, source hashes, observed native schema and production
applied-ledger pins must come from its frozen composition and actual migration
receipt. Synthetic initialization timestamps and SQLite ledger hashes must not
be reused as production ledger evidence.

The release reviewer signs the independently accepted source/schema/catalog and
selected profile. The backup authority separately signs actual inventory and
retained backup horizons. The worker's role key signs operation-specific
empty/settled role dispositions. Two distinct HMAC secrets protect the tombstone
envelope and subject/successor bindings. An empty deployment must first have a
real independently attested inventory/ledger root; an assumed empty backup list
cannot stand in for that producer. These concrete inputs belong to the hosted
boundary managed by Coordinator.

## Deployment input locations and installer sequence

Proposed persistent artifact locations are
`/data/platform-erasure/reviews/community-release.json`,
`/data/platform-erasure/inventory/current.json` and
`/data/platform-erasure/tombstones/ledger.json`. Coordinator must confirm these
locations against the deployment's existing private storage policy before
provisioning. Set the corresponding REVIEW_PATH, BACKUP_PATH and TOMBSTONE_PATH
environment variables listed above. The files use the signed envelope formats
read by the worker, with owner-only permissions and a persistent ledger. Source
code creates none of them during ordinary startup.

Reviewer and inventory public keys are PEM values in their PUBLIC_KEY variables.
The role signing private key is a PEM value in ROLE_PRIVATE_KEY. The two HMAC
secret values are distinct 32-byte secrets encoded as canonical base64url
(exactly 43 characters). Their KEY_REF values are nonsecret rotation references.
Independent reviewer/inventory private keys stay with their signing producers.
There is no reader environment variable for an independent private-key file and
no reason to put either producer's private key in the application runtime.

The bounded installer sequence is to apply only the approved canonical manifest
under Coordinator's migration lane, verify the native schema and applied ledger,
obtain the independent accepted catalog, and bind Core directly with that
catalog's byte hash. Under an actual authenticated owner request audit frame,
attach the real request principal, retain the original authorized owner scope,
then call `installProfile` with the reviewed profile reference, expected previous
generation, exact retention/restore references and reviewed expiry. It validates
owner authority and generation before the profile write. This is an existing
owner mutation, separate from synthetic candidate generation. A raw SQL insert
or a bootstrap boolean cannot substitute for it.

Next provision the signed release/inventory and tombstone inputs, verify the
worker on a dedicated connection, then admit readiness. On a new ordinary full
account command, the signed selected profile can create its deletion lifecycle.
The real command must still pass current session/workspace/selection ownership
validation, and final deletion revalidates it again. Positive empty-role
whole-account deletion, interrupted retry and signed quarantine replay must be
verified against the exact frozen combined schema before the release is ready.


## Signed v5 full-root rehearsal

The [exact current-reader rehearsal](community-erasure-v5-root-20261117.json)
composes Core `79eab5ff` with Paid `4a0596ca` and its `3475c51` transport guards.
All imported Paid source bytes were compared to that commit. The native driver is
BetterSQLite 12.9.0 / SQLite 3.53.0. The historical 193-entry fixture manifest is
selected only in the test process; runtime registration is untouched.

The real signed reader, Core binding, worker bootstrap, explicit missing-lifecycle
admission and canonical full-account command run together. Empty Paid role facts
complete deletion and history. An existing paid role fact holds deletion. A new
paid fact inserted after the initial empty capture and before final sealing also
holds deletion. The two held cases preserve the user and the paid term. All
three cases preserve the unrelated publisher, grant no Premium authority and
make zero network calls, with `globalThis.fetch` set to fail on any attempt.

Evidence is retained in `/tmp/community-erasure-v5-root-MRbenG`. Generated local
keys and synthetic catalog acceptance are test fixtures. These results resolve
the empty-actor path on that fixture and do not qualify the final combined schema
or grant production signing authority. Rerun this harness against the final
frozen canonical manifest and independently reviewed inputs before release.

## Validity, renewal and artifact retirement proposal

The maintenance window is not a catalog or profile deadline. The candidate
expiry fields remain null until independent review accepts concrete dates.
The proposed catalog/profile review period is 90 days from actual acceptance,
with the signed worker release and installed profile bounded by that expiry.
Paid independently accepted this maximum with the conditions below. A changed source,
canonical schema/ledger, retention policy, provider realm or signing/binding
identity requires requalification even within that period. Source hashes and
schema validity are checked independently of the wall-clock deadline.

Coordinator owns expiry monitoring and the renewal record. Begin the next
source/schema/policy review 30 days before the accepted expiry, escalate any
remaining inputs at 14 days, and complete acceptance and bootstrap verification
at least seven days before expiry. These are proposed operational checkpoints,
not additional runtime expiry conditions or a scheduled automation claim. Each
accepted receipt must record its actual dates and responsible reviewer/renewal
owner. Ordinary reads never extend validity.

Renewal preflight must inventory every installed profile generation and every
live or pending lifecycle before changing anything. The existing profile
installer increments generation, so reinstalling a profile would invalidate
existing lifecycle pins. For idle live subjects, use the existing explicit
`readmitMember` command under a freshly authenticated principal after the new
profile is independently reviewed. It validates the current profile and records
its own transition. It must not be simulated with a bulk SQL update.

Pending and held roots retain their original operation, fence, claims and
profile scope. The worker requires equality with the signed selected profile.
Resolve them under their still-valid reviewed profile, or independently review
an explicit pending-operation transition before switching the selected profile
or generation. Do not clear holds or recreate lifecycles to make renewal pass.
If any such root cannot be transitioned safely, record that blocker well before
the accepted expiry and keep its required original evidence. A new profile
reference alone is insufficient for those operations. This constraint is part
of the independent renewal review.

Keep an accepted source/schema/catalog receipt, its exact byte hash, public
verification keys, applied-ledger receipt, profile generations and any signed
inventory/tombstone references while an active release, pending operation,
retained backup or successor verification depends on them. Key rotation needs
an explicit overlap/readback plan for those references before retiring an old
key. An expired signature is historical evidence and cannot admit new work.
Independent signing private keys stay with the signing producer.

Synthetic qualification directories can retire once their source and final
receipt are preserved durably, their reproduction or private archive readback
has been verified, and the Coordinator confirms there is no active release,
incident, pending operation or audit dependency on their original paths.
Source observations for abandoned vectors remain labeled UNQUALIFIED. They may
be archived as historical evidence but never repurposed as a current review.
Generated test credentials are isolated test material and grant no hosted
trust. Do not copy production private keys into test archives.

This plan selects no backup rotation cadence. Backup expiry and inventory
coverage remain the separately reviewed existing provider/storage facts.


## Independent validity review and renewal proof

Paid independently accepted the 90-day maximum on November 17, conditioned on
using the actual acceptance timestamp and never automatically extending any
earlier applicable expiry. It accepted 30/14/7 days as operational renewal
checkpoints, separate from text retention and backup handling. Actual catalog
and profile dates remain unset until final combined qualification.

The renewal rehearsal now includes ordinary deletion-only and member lifecycles.
It uses a real stored session and the Core request-frame sequence
`withRequestAuditFrame` → `attachRequestPrincipal` → `readmitMember`.
A changed installed profile generation and expired idle lifecycle first refuse
delete-command onboarding. Re-admission outside an authenticated frame also
refuses. The current-principal frame then refreshes the lifecycle to the reviewed
profile generation and bounded expiry. It does not create an ordinary user's
Membership authority and preserves the member user's existing authority count.
Subsequent full-root deletion succeeds through the actual signed v5 worker for
both users, using platform-session authorization and zero network calls.

The five-case evidence is `/tmp/community-erasure-v5-root-uSSv4t/receipt.json`.
It still uses an isolated historical 193-entry schema and synthetic signed trust.
The earlier three-case evidence remains retained separately.

The harness invokes the real Core request API directly. Its request URL is a
fixture label, not a newly installed HTTP endpoint. The existing explicit
application readmit callsite is the Paid initializer, whose prepared configuration
requires a Membership policy. At that method-only checkpoint, a general ordinary-account renewal entrypoint
was an integration deliverable. The confirmed account request integration below
now supplies it. Coordinator must expose the tested
current-principal sequence with server-selected reviewed profile, existing
mutation/session validation and no Membership-enrollment requirement before
rotating profiles for ordinary accounts. This proof alone does not supply that
route. No renewal is performed implicitly by the deletion worker.

Pending/held operations keep their original scope and fences. Their resolution
or separately reviewed transition must precede a profile/key switch. Retain old
public verification and review material while referenced. Private/decryption/HMAC
keys are retained only when actual pending or recovery evidence needs them,
under its reviewed custody policy. There is no blanket perpetual private-key
retention. The active 193/native audit fixtures remain retained for this release.


## Confirmed account request integration

The existing `/api/platform/account-erasure` POST now prepares a confirmed
full-account command before dispatching it to the worker. It uses the actual
mutation/session checks, signed-v5 server profile and Core request audit frame.
Only an idle live lifecycle can be explicitly readmitted to the reviewed current
profile. Fresh subjects remain the worker's admission responsibility. Pending
and held operations keep their original scopes and retry protocol. Browser body
fields cannot select profile, operating mode or another user.

Request preparation performs no provider call or root closure. The existing
supervisor slot is asserted before opening its renewal writer, then asserted
again when dispatching the worker. Preparation and dispatch are synchronous,
with no intervening await. Root deletion, file cleanup and provider preparation
remain off the request thread. Completion still waits for actual worker exit.
The request/worker envelope carries the existing server-derived authenticated
scope and session metadata.

The [immutable request integration receipt](community-erasure-account-request-20261117.json)
records thirteen successful native handler cases and 32 focused tests across five
files. Scoped TypeScript checks passed. The real handler resolves stored
sessions and invokes the real request preparation; the real supervisor starts
the compiled worker and waits for it. The fixture uses BetterSQLite 12.9.0 /
SQLite 3.53.0, the historical 193-entry schema and the exact Paid v5 reader.

Successful cases cover fresh ordinary deletion, an existing legacy Membership
subscription and configured global Premium role with no new Paid role facts,
expired/profile-generation renewal for ordinary and member lifecycles,
body-field forgery being ignored, and production `__Host-` cookies. Refused cases
cover nonempty or concurrently added Paid role facts, pending/held lifecycle
renewal, CSRF failure, expired sessions, and cross-user principal/command
mismatch. Every case records zero network attempts and retains the unrelated
publisher. No new Premium authority is enrolled by request readmission.

The test worker bundle selects the historical fixture manifest, blocks every
network call, and injects a local paid fact during preparation only for the race
case. Production source has none of those test hooks. A missing public-origin
fixture setting initially prevented response cookie cleanup in the production
case; binding its synthetic HTTPS origin resolved the fixture failure without
changing cookie implementation. Paid independently read the final source and
thirteen-case receipt and found no remaining source blocker.

Evidence is `/tmp/community-erasure-v5-root-WRi71D`, with receipt SHA-256
`dab21135357ced8a2f2b64495a5040b2b3b5f496710b2b6fc86924f34080c1fc`.
This closes the ordinary-user request integration deliverable. Exact final
combined native schema/catalog review and deployment signing/bootstrap remain
pending. Current production accounts were never deleted or used as fixtures.
No UI copy changed, so Help Center updates are unnecessary.
