# Partner Channels QA status

November 17, 2026, America/Toronto. This reconciles the working plan's R1–R10,
twenty workflow steps and required acceptance inventory. The controlling source
starts at `bc39784944f343cebe5bbadce914b69d1487fdee` on
`codex/preserve-paid-main-composed-20261116`. The assigned feature worktree is
`/home/traderlink/projects/partner-admin-auth`.

Technical QA remains incomplete. The regular app has verified local and sandbox
coverage, including actual Whop termination and Discord role removal. One
provider check (actual Whop failed-renewal grace) and the runtime qualification described below remain open.
Owner visual review remains open. Deployment is outside this task; the latest owner instruction keeps the old preview off and prohibits deployment here.

## Source and verification boundary

- Before the new access correction, all 4,337 tracked application, source, scripts and root files checked in
  `/tmp/traderlink-paid-qa-route-h9zabhuj/main-local-app` matched the preserved
  commit. All twelve files in the final Whop sandbox change matched both that
  composition and the assigned feature worktree.
- The current saved Partner and hosted-startup regression contains492 passes
  and four gated skips. The four exact cases and the independently completed
  capture replay are listed below. They are not four failed provider checks or
  four completed new provider runs. The latest scoped TypeScript check covers241
  integrated files with zero diagnostics; changed-file lint is clean. Earlier
  access and Whop counts below retain their historical source scope. Two existing
  dashboard-hook warnings remain outside the changed lines.
- The full application build, 304-page generation and isolated compiled startup
  passed at `6ab662ad2b3e9eff2dc2d23781feef04c3ae4e40`. The later dispute routes
  compiled at `b75aa25d3289a1e3981cf6abc99e4a7d6b46c183`. A scoped Next.js compile
  for the final Whop sandbox source passed on November 17 with all 22 scoped route-manifest entries. The follow-up access-gate compilation also passed, with the same 22 scoped route-manifest entries. Both runs restored their temporary scratch configuration.
- The isolated candidate’s last migration is `0212_platform_paid_stripe_checkout_reviewed_version`
  at order 267, with 193 applied migrations. Its populated upgrade, atomic
  rollback, rerun, backup restoration and signed buyer erasure/restore evidence
  are retained. Order 266 remains reserved in that historical candidate. These orders are not a newly qualified canonical release suffix; the live prefix and combined additions require a new append-only rehearsal and fresh shared signed binding. No migration was executed in this review.
- External test runs used Stripe or Whop sandbox accounts and the registered
  Discord test server. TraderLink paid Premium was supplied by an isolated
  verified fixture. They do not qualify the production Premium feed.

The access correction is preserved at local commit
`17e81d32197df5033565ac978cee9d4873399d04` on
`codex/paid-owner-review-20261117`, without changing the canonical checkout or index.

## Approved requirements and evidence

| Requirement and workflow | Evidence inspected | Completion boundary |
| --- | --- | --- |
| R1. Connected server applications and later applicants, steps 1–7 | Regular owner routes, community ownership checks, admitted mutation tests, draft/reload browser checks and source-channel browser checks | Connected owner application is covered with isolated identities. Deployment identities and actual recruitment are later operational work. |
| R2. Inspection, versioned review and explicit activation, steps 8–12 | Publishing-consent, provider-verification and admitted-mutation tests. Regular browser review/access checks cover change requests, decline, resubmission, stale writes, separate consent and unchanged approved offers. Mapping activation check used actual Stripe checkout after the configuration passed. | Local review flow is covered. Free human inspection of an actual publisher's private server and final destination configuration require the configured owner and source. |
| R3. Actual names, supported channels and rename persistence | Discord name-refresh, channel-catalog and provider-verification tests. Source-readiness browser check covers unsupported and unreadable channels, bot identity and permission failures. | Names stay bound to Discord IDs. Actual source bot installation remains a runtime configuration check. |
| R4. Free personal inspection of all source channels | Publishing-consent tests plus the regular review-access browser check. Pending access can be submitted, approval requires the admin's confirmed inspection and the application version is retained. | Applicant statements and bot readability cannot establish personal inspection. The actual owner performs that operational inspection. |
| R5. Individual channels, packages, prices, cadence and amendments | Content/pricing, offer-coverage, checkout, catalog, idempotency and schema tests. Actual Stripe checkouts exercised publisher prices, reviewed amendments, pending channel activation and overlapping purchases. | The physical registered-server repeat passed on November 17: distinct channel/package checkouts granted the correct roles; package cancellation retained the individual role and exact Discord link, and final individual cancellation removed the last role. Both members’ original role lists were restored. |
| R6. Paid Premium plus purchased coverage, steps 13–19 | Access-policy, subscriber HTTP, native authority, existing Whop, exact role transport, manual review and channel permission tests. Actual Discord runs cover grants, cancellation, period end, failed Stripe renewal/recovery, refunds, disputes and Whop termination. | The approved production Premium source is still required. Actual Whop failed-renewal grace remains unverified. |
| R7. New/existing publisher Stripe accounts and retained Whop access | Persistent onboarding/OAuth, authorization generation, invoice/adjustment order and seller disconnect/reconnect evidence. Actual new/existing sandbox seller setup, paid receipts and regular app checkout are retained. Actual Whop active access and immediate termination passed. | No duplicate purchase was required for the existing Whop buyer. The fresh test membership did not enter failed-renewal grace. |
| R8. No TradersLink publishing fee | Current request/runtime/repository paths, publishing-consent tests and the fee-free signup/approval browser evidence | Publishing approval and activation use consent and inspection. New purchases are direct publisher Stripe payments with no platform fee. |
| R9. Approved syndication, editing, deletion and lifecycle controls, steps 12 and 18–20 | Persisted Gateway/session, scoped message REST and worker tests. Isolated full-text/multipart delivery, moderation, uncertain-send, restart, permission failure, pause/recovery, edit/delete and seven-day expiry proofs | Local transport and state behavior are covered. Actual publisher ingress and destination bindings require their approved runtime qualification. |
| R10. UI, persistence and honest outcomes | Owner interaction tests and regular browser logs for catalog history, overlap warnings, price amendments, review decisions, inspection, unavailable channels and expired alert activity | Desktop Light and mobile Navy cases include focus, cancel, disabled/error, reload and saving behavior. Revised screens still need owner visual acceptance. |

The application, review, offer, subscriber, publishing and privacy/UI acceptance
groups are represented in these rows. Owner/subscriber isolation, current
authorization, stale writes, duplicate and reordered events, bounded provider
reads, overlapping purchases and unrelated Discord roles are covered by the
listed tests and scoped browser/provider evidence. Source deletion and local text
expiry have separate proofs. The record does not treat simulated Discord delivery
or isolated paid Premium observations as actual deployment configuration.

## Remaining findings

| Item | Current evidence | Exact next check or dependency |
| --- | --- | --- |
| Physical channel/package overlap | Closed on November 17 after the owner created `partner-package-qa`. Both genuine Stripe sandbox purchases passed through the regular catalog, signed webhooks, durable billing rows and physical Discord roles. Package cancellation removed only the package-exclusive role; the individual channel stayed subscribed with its exact destination link. Individual cancellation removed the final paid role. Both original member-role lists were restored and temporary roles deleted. | No remaining physical-overlap check for this source. Both own checkout claims closed; independent readback confirmed removed test roles and unchanged owner-created channel. Premium and catalog authority remain isolated fixtures and do not qualify deployment bindings. |
| Actual Whop renewal grace | Actual active access and immediate termination passed through the regular app and Discord. The fixture separately passed past-due customer access, temporary outage and explicit product denial. | Obtain an authorized disposable Whop sandbox membership in `past_due` after a verified paid charge and a failed renewal. Run the existing Whop preflight and app/worker checks while Whop grants customer access, then verify its confirmed loss. The previous test membership was terminated. The PC browser’s available Charge dialog creates a standalone customer charge and has no membership/renewal association; it was not submitted. Current Whop documentation requires a future renewal date and provides no immediate renewal trigger. No redundant purchase was created. |
| Access correction and compilation | Both final Whop and follow-up access source compiled successfully with 22 manifest entries. Access changes passed 435 tests, four explicit skips, and changed-file lint. Expanded types after fixture corrections cover 231 files with zero diagnostics. | Closed for this isolated source. Canonical Community helper remains unchanged from commit `caaf7bcb790eb647b945f418682356199533ce64`. This is not a full combined release build or hosted acceptance. |
| Paid Premium runtime source | Tests require an independent current paid Premium fact and protect the complimentary role. Sandbox provider tests supplied that fact through an isolated fixture. | Bind and qualify the approved native paid Premium producer and current configured role IDs before final deployment review. A Discord role alone cannot prove payment. |
| Publishing and erasure runtime qualification | Local Gateway/REST and signed buyer restore evidence passed on the 193-entry candidate. The actual release catalog is unqualified. | Qualify configured publisher/owner/bot/destination identities and the shared erasure catalog. Settle seller deletion where another community owner or subscribers retain obligations. Preserve current buyer and shared-owner records. |
| Owner acceptance | Revised desktop/mobile browser checks are retained. | Owner reviews the revised screens and the documented destination/inspection decisions. The two-account outer gate is implemented and tested. Owner visual acceptance and any hosted operation remain separate from local source qualification. |

Existing successful tests stay closed unless a changed dependency, failing check
or new source finding requires a repeat. The old Whop preview is off and this
review does not perform staging or production operations. The owner explicitly instructed this task to leave the new release coordinator alone; completion work and the PC sandbox checks were handled directly.

## Preserved evidence locations

The November 16 progress sections provide the chronological source and scope
for each result. These current files remain in
`/tmp/traderlink-paid-qa-route-h9zabhuj`.

- `main-local-app-dispute-lifecycle-regression.log` records the latest 390-test
  suite, also used by the final Whop scope verification script.
- `main-local-app-full-candidate-build.log`,
  `main-local-app-dispute-lifecycle-next-compile.log` and
  `paid-main-built-private-smoke.py` document their different source/build scopes.
- `main-local-app-review-access-193-browser.log`,
  `main-local-app-source-readiness-193-browser.log`,
  `main-local-app-offer-amendment-mobile.log` and the review-feedback,
  purchase-history and alert-activity logs record browser assertions.
- `main-local-app-period-end-193.log`, `main-local-app-late-renewal-193.log`,
  the refund/dispute lifecycle logs and `genuine-whop-discord-revocation-193.log`
  record provider and role assertions. The latter confirms actual Whop product
  access loss, the hidden Discord link and exact role removal.
- The current migration fixture, `main-order-rehearsal/candidate-backup.sqlite`,
  and `offer-amendment-193-c9r7PW/candidate.sqlite` remain available to their
  current runners. Historical archived fixtures require exact recall first.

The screen specification's previous Whop-only purchase wording was reconciled
with the approved publisher Stripe flow. The subscriber Help guide was reviewed
and already explains the two paid requirements, publisher Stripe billing,
retained Whop access and grace. No Help behavior change was needed in this pass.

## November 17 access correction

All four human Paid pages and fifteen human API entrypoints (thirteen methods
plus both OAuth callback routes) now use the canonical two-account Community
review boundary before runtime/provider work. Active Discord identity is required;
removed identities, unrelated signed-in accounts and missing/malformed selectors
fail closed. Existing community ownership and admin checks remain in the handlers.
The legacy sandbox checkout is also gated. Signed Stripe/Whop webhooks are
unchanged and retain machine authentication. Isolated development identities remain
supported.

Partner navigation uses the account selector, independently of the runtime effect
flag. The admin Partner review entry has its own server-derived visibility boolean.
The source composition preserves other shared navigation edits; the assigned older
shell is not copied over the newer composed shell.

The 45 new checks use a disposable native identity table and invoke all fifteen
actual human API handlers, all four page functions and provider route boundaries.
The shared helper is byte-for-byte the Community-owned commit. React checklist:
authorization stays server-side, providers are reached only after authorization,
no hook order or theme token changed, and no mutable request identity is cached.
The subscriber Help guide was inspected; billing/access behavior is unchanged and
requires no guide revision for this internal review restriction.

Safe UI review needs the existing valid Platform session/database configuration,
the already configured `TRADERLINK_WATCHLIST_DASHBOARD_NAV_DISCORD_SUBJECT`
selector, and an active matching Discord identity. Admin review additionally
requires the existing admin grant. No new key is needed to render the page shell;
unavailable catalog/provider configuration is displayed honestly. Draft saves,
checkout and fulfillment retain their separate schema/admission/provider barriers.
No runtime, webhook, delivery or worker flag was enabled here.

New proof files: `paid-owner-review-final-types.log`,
`paid-owner-review-final-lint.log`, `paid-owner-review-final-regression.log`,
`paid-final-whop-next-compile-receipt.json`,
`paid-owner-review-source-delta.json`, and
`paid-test-discord-capabilities-20261117.json`, under the existing isolated QA root.

## Complete-type fixture correction

The complete combined type preflight exposed six additional Paid test-fixture
errors that were outside the previous scoped roots. One correction batch adds
an explicit test NODE_ENV, supplies a complete erasure-runtime fixture, types
tombstone arrays, uses NextRequest at the actual route boundary, rejects a
missing linked Discord test member, and keeps Whop fixture objects spreadable
and checked against their preparation contract. Deliberately invalid negative
cases and their rejection assertions are preserved. Production contracts did
not change.

The expanded 231-file type check now reports zero diagnostics, the six-file
lint check reports zero errors, and the relevant tests report nine passes and
two explicit provider/browser-gated skips. These two skipped cases are already
included in the four skips of the 435-test integrated result; they are not
additional passing provider proofs. The whole combined application still has
other owners' separate integration/type work and is not qualified by this
feature-only result.

The cached scoped Next compilation after the access correction passed all 22
route-manifest entries. Its receipt is
`paid-owner-review-next-compile-receipt.json`. Temporary Next configuration and
synthetic catalog placement were restored. All 27 explicit source/test files
matched local commit `e38cc808f86d3db68812b97e2d22f23e7721af96`. The canonical
Community helper hash remains
`c8b6ce94bb5525324159fa8c13ab627122e977d10029263fe4b55c3488fe1882`.
Read-only listener verification found no listener on either old paid preview
port, 3038 or 3039. No preview was started and no hosted operation ran.

The PC chat confirmed that neither its current Discord account nor the bot could
create the second test channel. The owner created `partner-package-qa` and the
prepared runner completed the physical overlap case. No repeated login or key
creation was required. Only the two sandbox purchases required by this new
physical test were made, and both resulting subscriptions were canceled.

## Physical Discord overlap proof

The new channel was read back by exact ID `1572286475033116732` in registered
guild `1559172784813514803`. The current source was rebuilt into the existing
physical-test harness, including the canonical account gate. No runtime source
changed. The test bound only its isolated buyer/admin selector and reused the
preserved synthetic 193-entry catalog after the earlier donor cleanup.

Genuine hosted Stripe sandbox checkouts, signed invoice/deletion events,
persistent claims/paid terms, catalog overlap warning, Discord grants and both
cancellations all passed. The exact role transitions were grant individual,
grant package-exclusive, remove package-exclusive, remove individual. Repeated
idempotent grants were allowed; no wrong-role removal was observed. The sentinel
role and another member's same mapped role stayed unchanged throughout the
application operations; fixture cleanup then restored both original role lists.
Foreign keys remained valid, both own checkout claims closed, and independent
Discord readback confirmed the managed test roles were deleted. The owner-created
channel was left unchanged.

The temporary local test application and Stripe listener stopped on completion;
ports 3038/3039 have no listener. The old Whop preview remains off. No hosted
configuration, production data, production billing or deployment was changed.
The release coordinator was not contacted. This test adds provider evidence and
does not change customer behavior or require a Help guide change.

Evidence: `physical-overlap-final-receipt-20261117.json`,
`physical-overlap-genuine-discord-20261117.log`, and
`physical-overlap-proof-source-20261117.tar.gz`, under the isolated QA root.

Proof log SHA256: `8394df82157e68273878e2bda882650052d70a855191ca3b61f7865a9ac59490`.
Proof source archive SHA256: `eb396f6c6097f985f3891241c6e19908172a0ab6321d8ac8cab5cfd93c1460bf`.

## Exact Discord review guild

The owner’s direct November 17 instruction limits all Community Discord work to
`TradersLink Tests`, exact guild `1559172784813514803`. Paid adopts the unchanged
canonical helper from `fe5892683f3343ae1a8189d6ded6a64ade65ad5f`.

Configured Paid catalog, provider verification, member observation, role REST,
name refresh, mirroring and erasure observer/runtime now use guarded native
adapters. Source and destination bindings are rechecked at execution, including
historical/queued roles and old message cleanup. Channel-only endpoints now
resolve metadata solely from the fresh approved-guild channel inventory. No
submitted channel is contacted to discover its guild. Exact membership, identity,
guild and supported type must pass before channel/message I/O. Per-operation
mapping and caller authorization are rechecked after the inventory await. Wrong
guilds, numeric/missing IDs, missing/duplicate channels, unsupported types,
unknown endpoints, changed metadata and foreign origins fail closed.
Redirects are refused. No caller-provided label or configuration overrides the
approved guild. The explicit Discord QA helper also refuses any other guild
before reading bot identity or creating temporary roles.

The full applicable regression passed 457 tests with four explicit external
skips. Expanded scoped types cover238 integrated files with zero diagnostics.
Changed-file ESLint is clean. The final QA-helper-only follow-up passed26 focused
checks, including cleanup, native erasure member absence and guild restrictions.
Actual catalog/webhook/role-worker imports bundled successfully without running
the generated bundle. No new real Discord test or post was performed for this
policy correction, and no preview was started. The earlier genuine physical
purchase/overlap proof stays tied to its recorded e38cc808 source.

The native wrapper leaves the generic injected domain adapters usable for
isolated synthetic contracts. Every configured/native Paid caller imports the
guarded adapter instead. Global Membership transports, bot secrets, provider
flags, migration descriptors and shared Community worker source were not changed.
The release coordinator was not contacted. Evidence scope and full per-file
preimages are in `paid-review-guild-scope-20261117.json`; qualification logs use
`paid-review-guild-final-*` in the retained QA directory.

## Signed worker-input successor

Source-only v5 is implemented as exactly25 signed fields: the old v4 fields,
then selected `erasureProfileRef` and `effectMode`. Only a valid v5 returns
`releaseFormat: v5`; legacy returned objects keep those properties absent.
The selected profile and mode cannot come from the HTTP command or an env toggle.
V5 validates the entire current imported manifest and exact signed applied ledger,
including the final native schema. V1–V4 keep their previous qualification rules.

`no_discord_effects` requires signed null bot/output references, the digest of an
empty bindings array and empty protected roles. It needs no fabricated Discord
registration or bot secret. The composed erasure runtime has no configuration;
Core may attest only current authoritative empty affected-role facts. Nonempty,
changed or unverified facts hold the command. Existing global Membership values
are not removed or used to select this mode. Roles mode retains configured
protected roles and exact approved-guild bindings.

Core owns full-root command revalidation, explicit deletion-only lifecycle
admission and pending-operation rules. Worker admission still refuses expired
or profile-mismatched lifecycles. The existing authenticated deletion route now
has a separate explicit preparation step that can renew only a live idle
lifecycle using the current signed profile; it creates no Membership authority.
Pending and held operations retain their original scope. The final combined
schema/catalog, profile installation, source vector and real signed artifacts
remain UNQUALIFIED until their separate proof and independent review.

The current isolated Partner/startup suite passes477 tests with four explicit
external-fixture skips.240 integrated files have zero type diagnostics; changed
reader tests/source have clean lint. New parser/signature tests use synthetic
native SQLite metadata only and are not a migration rehearsal, live profile,
provider check or production acceptance. Evidence is retained as
`paid-erasure-reader-v5-final-types.log`, `paid-erasure-reader-v5-final-lint.log`,
and `paid-erasure-reader-v5-final-regression.log` under the isolated QA root.

## Joint full-root v5 rehearsal

Core preserved the exact composed-source proof at
`19bf2aeb0aaa052572b7d67309ef418006bee1b1`, using Paid
`4a0596ca24626c0ccfae963250c455dfba51daa5` and Core
`79eab5ffec49af63ce2e6ba5595d3a31f7ddb2eb`.209 imported dependency files
matched Git bytes. The actual signed reader, Core binder, worker bootstrap,
deletion-only lifecycle admission and canonical root command ran on real native
SQLite with the historical193 schema and generated test keys/catalog.

An ordinary account with empty Paid role facts was deleted successfully.
Existing affected role facts held deletion. Facts inserted after the first empty
capture but before sealing also held deletion. Both held cases preserved the
user and Paid term. Every scenario preserved the unrelated publisher, created
no Premium authority and attempted zero network calls.

The committed receipt is
`/home/traderlink/projects/community-core-port-20261117/docs/migration/community-erasure-v5-root-20261117.json`,
SHA256 `6776d740d15559e7123ee75a9c08dd5e49bfb151bfb68e5abb186ef00fb1fccd`.
The receipt explicitly says `UNQUALIFIED_SYNTHETIC_ONLY`. This closes the
composed source-behavior rehearsal; the final canonical combined schema,
reviewed profile/catalog, source vector and real signed artifacts remain a
separate integration qualification. Production is unchanged.

## Exact optional checks and handoff

The last broad run remains477 passed and four gated skips. The skipped cases
were these exact opt-in tests; they are not four new runtime failures:

| Test | Gate in the broad run | Current evidence and next condition |
| --- | --- | --- |
| `partner-alert-stripe-checkout-browser.test.ts`: completes Stripe channel and package checkout and reconciles Discord roles on the real test guild | No `PARTNER_STRIPE_CHECKOUT_TEST_KEY`, `PARTNER_STRIPE_CHECKOUT_CLI` or `PARTNER_STRIPE_DISCORD_BOT_TOKEN` was injected into routine regression. Connect/catalog variants also need the intended seller/onboarding/session fixtures. | The separate recorded genuine catalog/physical-overlap run passed on e38cc808. A fresh run on current code needs a current authorized app/session fixture and securely sourced approved-guild channel bindings; no fresh provider or Discord effects were enabled by the relay. |
| `partner-alert-stripe-connected-adjustments.test.ts`: reconciles Stripe Connect sandbox refunds, disputes, and a failed renewal | Requires checkout test key, seller account, Stripe CLI and bot token together. | Earlier genuine adjustment/renewal proofs are retained. They are not silently recounted as a new run. Current source-wide deterministic tests pass; fresh external effects stay opt-in. |
| `partner-alert-stripe-sandbox-webhook.test.ts`: replays real Stripe sandbox events and removes only the reviewed managed Discord role | `PARTNER_STRIPE_SANDBOX_CAPTURE` was unset. | Independently unblocked and PASSED with the retained eight-event capture, synthetic current signatures and mocked Discord transport. Global fetch was replaced with a rejecting function; real Discord/fresh-delivery/native-effect flags were explicitly off. This is capture replay, not fresh provider delivery or another physical proof. |
| `partner-alert-whop-inbox.test.ts`: the native Stripe reconciliation changes only its assigned Discord test role | `PARTNER_STRIPE_QA_NATIVE_DISCORD` was not1; an enabled run also requires the bot token. | The dormant role-only fixture used the former second test guild. It now sources guild/channel IDs directly from the approved test-guild fixture; it does not approve or exercise syndication. Its eleven source-only cases pass, its actual Discord case remains opt-in, and no real roles were touched for this correction. |

The capture replay result is retained in
`paid-captured-stripe-source-only-20261117.log` and its JSON receipt. The native
fixture correction has clean lint and expanded241-file types. No additional
broad test rerun was needed for that test-fixture-only change.

The remaining integration work is the frozen combined-source/native-schema
qualification, reviewed profile/catalog and signed v5 artifacts, paid Premium
producer and publisher/destination bindings, plus the separately recorded actual
Whop renewal-grace limitation. These are not waived by the skipped tests or by
the successful historical193 rehearsal. The existing isolated actor/guild,
callback, privacy, signature, ledger, schema and role-union source cases are
clean; the runnable retained capture replay was completed without network I/O.
No failed source-only case remains concealed as a provider skip.

Authoritative source is the preserved Git ref
`codex/paid-owner-review-20261117` in
`/home/traderlink/projects/traderlink-platform`. The implementation workspace is
`/home/traderlink/projects/partner-admin-auth`, on its older assigned branch with
mixed unfinished files. Do not copy that entire worktree or merge the old base
onto the current integration lane. Use the exact preserved commits/allowlists
and retain canonical migration order changes. No migration descriptor changed
in the follow-ups after bc397849. The machine handoff in the retained QA root
records the current tip and per-file hashes against that composed base.

The direct owner instruction in this chat prohibits contacting the new release
coordinator. This handoff is saved for inspection; no message to that coordinator,
preview restart, configuration change, deployment or new live test was performed.

## Existing account-deletion route

The existing confirmed `POST /api/platform/account-erasure` now performs bounded
request preparation before its worker handoff. It checks the current mutation
request, stored session and authenticated principal. The selected profile and
effect mode come from the verified server-side v5 review; browser fields cannot
select them. Only a live idle lifecycle can be refreshed. Missing lifecycles
remain worker-admitted; pending/held roots keep their original scope and fences.
The worker slot is checked before opening the preparation writer, and all root
and provider work remains in the worker. No Membership enrollment or Premium
subscription is needed for an ordinary account to delete itself.

Core's final actual-handler/native-SQLite rehearsal passed13 cases on the
historical193 schema: ordinary and legacy Premium accounts, refreshed ordinary
and member lifecycles, existing or concurrently added Paid role facts, pending
and held roots, CSRF and session rejection, ignored forged browser fields,
cross-user refusal and production secure-cookie handling. The six eligible
accounts deleted successfully; the seven ineligible cases held or refused.
Every case preserved the unrelated publisher and attempted zero network calls.
Ordinary renewal created no Membership authority. The forged body could not
redirect deletion or choose the profile/mode.

Core implementation checkpoint: `44cc913b83a71e4f4a5f3796996b036b25113c57`,
parent `4ef93f9ca4821e5e1e5b957f61c9bac5550aa55e`. All eight committed
source/harness hashes match the saved handoff. The separate Core receipt is
`docs/migration/community-erasure-account-request-20261117.json` in its assigned
`/home/traderlink/projects/community-core-port-20261117` workspace.

Final receipt: `/tmp/community-erasure-v5-root-WRi71D/receipt.json`, SHA256
`dab21135357ced8a2f2b64495a5040b2b3b5f496710b2b6fc86924f34080c1fc`.
This uses generated test review/catalog keys and is explicitly UNQUALIFIED.
It is source behavior evidence, not final combined schema/catalog qualification,
actual Discord removal evidence or hosted acceptance. The earlier physical
channel/package and Whop tests retain their own exact source scopes.

Core's32 focused route, preparation, command and supervisor checks and scoped
TypeScript check passed. The preparation checks cover a database with no Paid
module, legacy signed formats, missing reviews and unchanged tracker-account
handling.
Paid reviewed the concrete request/command/supervisor changes and independently
verified the final receipt; Core owns and ran the handler/worker proof. No new
page or user step was introduced, and the Help audit needs no guide change.
The seven-day alert-text limit and removed backup-rotation policy are unchanged.
The old preview remains off and no deployment or release-coordinator contact
was performed by this task.

## Approved-guild-only channel discovery correction

A concrete follow-up source review found that the native wrapper's initial
channel metadata lookup could contact a foreign channel before rejecting its
guild. The correction uses only
`GET /guilds/1559172784813514803/channels` for discovery. A direct channel
metadata request is satisfied from its single verified inventory entry. Every
message operation gets a fresh inventory; retries cannot reuse prior membership.
Missing or duplicate IDs, wrong guild/type, malformed or oversized inventories,
failed responses and expired signals refuse before channel/message dispatch.

The new awaited discovery is also inside each native message operation's
current mapping/caller check. Scope or authorization changes during that await
prevent the actual message write. Existing ownership, permission and receipt
checks stay in the underlying message adapter; no producer contract or worker
scope was relaxed. The shared Community helper's guild-inventory approach was
inspected for consistency without editing its owner-controlled source.

All37 focused boundary tests passed. The full Paid/startup regression passed492
with the same four gated external skips.241 integrated files have zero type
diagnostics and changed-file lint is clean. Tests use synthetic transports with
global fetch forbidden, including explicit proof that rejected foreign channel
IDs cause only approved-guild inventory reads. Current create/edit/delete still
pass, and each refuses writes when authorization changes during final inventory
verification. Combined source5673b0878's two preimages exactly match the preserved
Paid parent, so the follow-up can be applied narrowly while preserving migration
orders. The plan's product scope, UI, Help, schema and migration files did not
change. No Discord/provider call, production configuration, preview or deployment
was performed. Evidence logs use `paid-approved-channel-inventory-*` in the
retained isolated QA directory.
