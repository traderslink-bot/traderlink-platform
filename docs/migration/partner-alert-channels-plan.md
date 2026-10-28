# Partner alert channels implementation plan

Updated: 2026-10-28. Current checkpoint24: actual request-writer integration with
the isolated Auth frame is authored, source-only and unverified at runtime. The
22 earlier source slices and immutable Auth proposal23 remain preserved. There
are39 owned TS paths; this successor changes only the existing request-writer.
[Progress and resume point](partner-alert-channels-progress.md).

The active assigned workspace for this successor is
`/home/traderlink/projects/partner-admin-auth`, branch
`codex/partner-admin-auth-parity-20261028`, baseline
`4c0e6b39463aa39afabc93ab3ccb5fdf7f97512a` (parent
`04cde1b49730b30e5ba23410029965e3e3ff24b3`, production-source ancestor
`a5ead4e35a846ac0d82cd365688b831d36ece8ee`). Use this path explicitly;
the native saved project/default cwd was not retargeted. The original mixed
preserved checkout and its frozen writer21 remain intact. Historical paths and
allocations below do not authorize edits there for this successor.

Actual isolated Auth postimage
`383e73ab1cf60ec4539b32239db10cbe53e2d451e6040ea574b5023e3fe59340`
is read-only and remains unqualified for runtime/canonical release. Only this
plan, the existing progress record and the existing writer are assigned. Other38
TS, immutable proposal, Auth, providers, HTTP/runtime and schema remain frozen.

## Owner review: agreed model, access solution and next decisions

This overview consolidates the owner's request to coordinate Shared alerts and the
PC relay, show the complete decisions and explain the Whop/Premium gate. The
source record below includes the prior22 slices, proposal23 and current-baseline
writer successor24; it is not a completed or activated feature. The remaining-decisions table at the end distinguishes choices
needed before affected activation from technical integration work; it does not
require every commercial amount before further isolated implementation.

- Publishing: one public standard first-channel fee plus an additional-channel
  fee, collected through the TradersLink owner's Whop. Private negotiated terms
  remain possible without publishing a different public price list. Accepted
  terms are versioned per community; there is no mandatory subscriber price cap.
- Subscriber billing: the community sells its own individual channels and
  optional same-community packages through its own Whop. It remains responsible
  for collection, payouts, cancellations and refunds. The two billing
  relationships are independent and must be explained before purchase.
- Content: incoming community posts are text only and read only in TradersLink.
  No images, attachments, embeds, links, invites or server promotion. Configured
  server names/aliases and link/promotion detection hold an entire suspect post
  for review. Detection cannot guarantee recognition of every disguised advert.
- Access: CURRENT PAID TradersLink Premium AND verified paid coverage for the
  selected community channel. Ordinary complimentary Premium stays separate and
  never supplies Partner paid eligibility. The resolved grantor-deletion policy
  preserves the recipient's ordinary gift and original terms while removing the
  deleted grantor's identity through qualified nonidentifying provenance.
- Control: TradersLink approves every mapping and owns the dedicated destination
  role. The community's Whop role integration stays in its own server; it has no
  authority over TradersLink's paid channel roles.

The proposed connection is verification only: the community approves the minimum
Whop read permissions needed for membership and actual paid-period/refund/dispute
evidence. Signed events trigger fresh authoritative reads; periodic reconciliation
covers missing events. A linked verified identity binds the purchase to the member.
No charge, refund, cancellation, payout or subscription-management write permission
is required for this design. Exact native scopes and paid-period semantics still
need qualification; an active membership label alone is insufficient.

TradersLink evaluates the complete AND condition and then materialises ONE
per-channel role. Discord cannot enforce this by separately allowing a Premium
role and a community role: role allows combine. The destination denies ordinary
access, and neither generic Premium/Whop roles nor member overrides may supply an
alternate allow. Setup qualification checks category/channel overwrites, other
role writers and hierarchy; detected drift pauses grants. Confirmed expiry or
invalidating payment facts remove the dedicated role while preserving any other
qualifying purchase. An outage is not proof of nonpayment; existing access is
bounded by verified paid terms and the explicit evidence-freshness policy.

Shared alerts retains TradersLink-authored outbound sharing, receiver consent,
full receiver alert content and its corrections/withdrawals. This feature owns
community-origin incoming content, publishing agreements and paid access. Their
source, routes, permissions and workers must remain separately allocated. The PC
relay coordinates product decisions; the VPS Coordinator selects source integration,
shared writers, previews and release order. This owner request was relayed directly
to both chats on 2026-10-28. Shared alerts confirmed no material conflict and no
source/release action; its publisher and receiver controls remain unchanged.
The PC relay response is separate from message delivery.

Current next engineering work is actual request/read authority and admitted-writer
binding on the selected current baseline, then separately allocated API/UI/native
provider integration. Minimal Whop permissions, paid-period proof, Discord effective
permissions, erasure/retention and recovery all need real qualification. More dormant
interfaces do not satisfy those dependencies. No live configuration, tests, runtime
activation or release is authorised by this documentation refresh.

## Current-baseline writer successor24 — actual Auth API integration

Coordinator completed the Git/import prerequisite before this allocation: exact39
owned TS and3docs were imported byte-for-byte onto the isolated current-source
baseline above. This worker received ONLY
`src/modules/partner-alerts/server/partner-alert-request-writer.ts`, preimage
`ed7c1a81ef86497409354b52af1b52027d4a65dcc32712e72bbadabc146b9fa8`,
and the two existing plan/progress docs. No application Auth implementation or
other source is assigned to this worker. The new setup-only AGENTS prefix remains
outside the feature allowlist and is not changed or staged.

The actual writer now enters the actual existing
`PlatformAdminAuthorization.withRequestAuditFrame(request, operation)` on the
same provided application connection. It no longer opens its own competing
IMMEDIATE transaction. Its real same-connection session/user/login/workspace/
role/link verifier, initial signed-in policy, original cookie/header/abort and
bounded monotonic freshness checks are preserved byte-for-byte. Initial resolver
output remains insufficient alone; private writer ownership is admitted only
inside the real Auth frame callback and checked around each protected read.

For each real repository operator read, the existing Partner authority's admin
binding delegates to `frame.authorize` and privately retains its genuine returned
scope object. Final validation selects that exact original object and delegates
to `frame.revalidate`, while calling the SAME existing Partner authority's
`requireOperator`. Its original authenticated time, original Auth authorized time
and Discord verification freshness are not recaptured or renewed. Actual returned
actor deadlines are checked against the latest same-connection verification.
Community-owner revalidation uses the same existing ownership method and checks
its actual deadline; ordinary community reads gain no operator/Premium requirement.

Read handles are closed before final validation. Saved callbacks/nested calls
cannot start another access during that phase; failures remain sticky and escape
the protected callback so the Auth frame can roll back private work. Capability
revocation and private connection-map cleanup remain in finally. No frame handle,
operator scope/actor, DB, identity or audit payload is exposed to the caller.
Only the same existing guarded private reads and detached result data are available.

Actual Auth owns savepoint rollback and genuine audit persistence. The writer
contains no policy copy, rate-reset/refund, manual audit persistence/replay, denial
swallowing, manual audit-only commit or fake receipt. The prototype's automatic
final current-policy reads remain in addition to the writer's final original-
scope/Partner-freshness validation; those do not create a second allow/rate call.
These are source paths and expected control flow, not executed policy acceptance.
Audit/rollback/commit failure and pre-commit process-loss limitations remain those
of the unqualified Auth prototype; no stronger durability claim is made here.

Current isolated exports were read directly: actual Auth postimage383e73ab above;
request resolver `e845c22963a5fff9cdb8399e1060274c00715c36ca619efc0363ee63625318ed`,
session repository `aa76ac103cd6ebfa9369bbe66fe7c897e12aa8bc7fec4c0eda7b4f241929c74c`,
session service `3c106e1f1b8a7a09d49e4601f4a4380cdfc77a9bb46875d8ca3acbb1d525ceda`,
workspace repository `8b592218c9c1b75e1b5c5efb18a46e98ed81a561fa190c1f038dfe2e7f8fbdfb`.
The resolver here actually supports Discord/Google/email. The old preserved
whole-file discrepancy remains historical; its source was not copied or edited.

No new file/export/port, test/import execution, SQL/DB action, Git mutation,
provider/Discord operation, dependency install, HTTP/runtime wiring, preview,
activation or release. Actual Auth runtime qualification, selected schema/config,
private GET entrypoint ownership, broader paid/native/privacy integration and
final UI review remain outstanding. Coordinator must review/preserve this exact
successor before allocating another path. PC relay receives immediate exact
handoff before any review/allocation wait or end of run.
[Successor24 progress](partner-alert-channels-progress.md#current-baseline-writer-successor24--actual-auth-frame).

## Authority and assigned source

The allocations below are chronological history. The current successor uses only
the explicitly assigned isolated workspace and allowlist above.

The owner first requested planning, then explicitly replaced early mockup/UI
approval with implementation first and UI review at the end. PC relay
`01a17f05-b71b-72e1-b677-bb910773ad5f` coordinates product decisions. VPS Visible
release coordinator `01a15615-c412-72f2-a565-db0f93a3f50a` owns workspace/Git,
preview and release operations. The owner's latest instruction prohibits tests,
including Vitest, provider/Discord actions, migration execution and Git publication
or commits. No build, preview or provider configuration is part of this slice.

The coordinator initially assigned seven new files listed in the progress record
inside `/home/traderlink/projects/platform-pc-preserved`, existing branch
`migration/pc-canonical-20261019`, HEAD
`2ed6cb7b840d64bf843a7c28d81c9c6f6cd1db47`. This mixed preservation checkout is
not accepted as the current application runtime. The canonical
`traderlink-platform` checkout remains frozen for Coaching. No branch switching,
copying, additional worktree, existing-file edit or runtime registration is allowed.
After the first source checkpoint, the coordinator assigned THREE further new
paths: `src/modules/partner-alerts/server/database/partner-alert-schema.ts`,
`src/modules/partner-alerts/server/partner-alert-repository.ts`, and
`src/modules/partner-alerts/server/partner-alert-authority.ts`. These may export
unregistered ID-free SQL and dormant repository/authority contracts only. The
repository may import the existing `better-sqlite3` TYPE, not a runtime opener;
authority contains only server-owned actor/verified-resource interfaces, not
existing auth/payment/Discord adapters. No database may be opened or SQL executed.
The coordinator next assigned five additional dormant source files under
`src/modules/partner-alerts/server/`: `partner-alert-whop-client.ts`,
`partner-alert-whop-normalization.ts`, `partner-alert-whop-webhook.ts`,
`partner-alert-whop-inbox.ts`, `partner-alert-credentials.ts`. Only own modules,
native Node crypto and existing SQLite TYPE may be imported. No actual transport,
token, credential/environment or database operation, route or runtime registration
is authorised. These sensitive boundaries need source review before integration.
Next assigned source-only paths in the same `server/` namespace:
`partner-alert-discord-gateway.ts`, `partner-alert-ingress-service.ts`,
`partner-alert-delivery-worker.ts`, `partner-alert-role-worker.ts`. Only injected
socket/transport/DB and own modules; no actual connection, startup, DB execution,
runtime/app/dependency integration. Own ID-free descriptor can retain per-part
destination references and old Discord subject role intents for safe correction
and unlink/relink; no shared schema/manifest change is implied.
Root migration register/progress/project-log updates require later shared-file
assignment; these two new documents cross-link to preserve the isolated record.
After the nineteen-file checkpoint the coordinator assigned three NEW dormant
bridge files: `partner-alert-platform-authority.ts`,
`partner-alert-request-boundary.ts`, `partner-alert-erasure.ts` in the same own
`server/` namespace. Read exact canonical existing exports as reference, recording
paths/hashes; existing files remain read-only. Imports must resolve to actual
exports, never an invented current adapter. OAuth/routes/pages/nav remain
unassigned until this bridge is reviewed. No configuration/environment, provider,
DB, erasure or runtime action is executed by the assignment.

Historical bridge findings: `evaluateMembershipFeature(...).allowed` can permit
off/shadow enforcement or owner bypass, while legacy Discord Premium helpers
permit guild owner/nonproduction fallback. Neither is valid evidence for this
feature. A configured-role-only strategy must be explicit, fresh and bound to
the verified active Discord identity; no universal Premium plan/feature mapping
is inferred. The owner subsequently selected strict PAID Platform Premium for
Partner channels; a Discord-role-only Premium strategy is not the selected rule.
The subscriber projection therefore remains diagnostic-only and
cannot authorise a role: current membership rows have no Discord subject and
the inspected identity repository only verifies a supplied subject, without an
exported unique-current-subject/snapshot binding. The current canonical erasure closure/command modules are absent
from the preserved checkout, whose older service purges inside a transaction.
Do not copy or bind that older implementation. Erasure bridge work is a pure
dependency/obligation descriptor, explicitly blocked from execution until a
current-baseline integration and owner/relay policy decision are reviewed.
The authority adapter uses TYPE-only actual current exports; the only imported
current runtime contract is the pure admin idempotency header constant. Existing
auth/admin/community implementations are required explicit server bindings, not
executed or replaced. [Dependency path/hash provenance](partner-alert-channels-progress.md#fifth-slice-dependency-provenance--read-only-source-snapshot)
records canonical and preserved source differences; matching a type is not runtime
compatibility. No positive subscriber binding or erasure executor is invented.
After preserving that twenty-two-file checkpoint, coordinator cleared one further
NEW path: `src/modules/partner-alerts/server/partner-alert-discord-subject-snapshot.ts`.
It may export own pure consistency-candidate types/normalisation only, using own
validation and no existing/current imports, config, DB or provider effects.
Raw caller observations never become actor, Premium or role authority. Current
identity provenance, monotonic generation, previous-subject history, native
member hydration and erasure bindings remain blockers; file ownership clearance
does not approve those semantics or current runtime integration.
Following the preserved twenty-three-path checkpoint, coordinator cleared one
further NEW path: `src/modules/partner-alerts/server/partner-alert-whop-reconciliation.ts`.
This may compose only own GET-only client/normalisers/contracts/validation into
bounded prepared evidence. No actual transport execution, DB persistence,
publishing activation, actor/Premium/Discord claims, payment writes, worker/route
registration or schema change. Current identity/provenance/erasure-generation
fences remain explicitly unbound; prepared output never authorises application.
After the twenty-four-path checkpoint, coordinator cleared one further NEW path:
`src/modules/partner-alerts/server/partner-alert-publishing-payment.ts`. Pure
prepared publishing-payment observations only, using own pricing/validation and
declared native read shapes, separate from subscriber offers. Recompute accepted
first/additional-channel total and bind owner Whop account/plan to the community
payer's subscription and finite payment period. Unsupported taxes/discounts,
multiple quantities/split payments, free terms and calendar-month native billing
must remain explicit qualification gaps, not guessed payment success. No actual
GET/crypto/DB/payment operation, actor/activation/current-agreement mutation,
schema/current-source edit or runtime registration; every output `canApply: false`.
Current identity, accepted-agreement, provider and erasure provenance remain
unqualified. Commercial/refund/pause policy stays with owner/PC relay.

Coordinator subsequently assigned exactly SIX independently absent NEW ordinary
Premium paths in this same preserved checkout (not Membership or canonical):
`src/modules/platform/contracts/platform-premium-access.ts`, and under
`src/modules/platform/server/membership/`: `platform-premium-paid-evidence.ts`,
`platform-premium-role-repository.ts`, `platform-premium-whop-reader.ts`,
`platform-premium-discord-client.ts`, `platform-premium-role-reconciliation.ts`.
They may contain dormant own contracts/business logic/injected ports only; all23
Partner source files remain byte-for-byte preserved. No existing membership,
webhook, authentication/generation, erasure, schema or manifest path is assigned.
Source ownership is independent of Discord UI setup and does not approve runtime,
provider/DB/Discord operations or checks. See the [ninth-slice record](partner-alert-channels-progress.md#ninth-source-slice--six-ordinary-premium-files).

The owner/PC feature manager then directed coding to resume before UI review.
Within the already assigned six Premium paths, the next source-only slice extends
ONLY `platform-premium-role-repository.ts`, `platform-premium-discord-client.ts`
and `platform-premium-role-reconciliation.ts` for bounded resumable discovery.
No new path/shared schema was self-assigned. Four-source candidate traversal,
transactional cursor/lease/review business rules and native GET page decoding are
now authored; actual durable storage, current identity mapping, paid/grant/retired
source readers and runtime scheduling remain unbound. Independent discovery/read
switches default off. No real member scan or provider operation was run. The
prior23 Partner bytes and other three Premium files remain preserved.
[Source-only tenth-slice handoff](partner-alert-channels-progress.md#tenth-source-slice--resumable-candidate-discovery).

Coordinator then assigned three NEW concrete source paths in this preserved
checkout: `src/modules/platform/server/membership/platform-premium-role-schema.ts`,
`platform-premium-role-store.ts` in that same directory, and
`src/modules/partner-alerts/server/partner-alert-runtime.ts`. They are authored;
no DB/SQL or runtime execution occurred. `platform-premium-current-authority.ts`
was reserved to this worker and remained absent at that checkpoint. Slice thirteen
now authors its dormant structural consumer after the actual Membership V2 handoff;
no current runtime binding is approved.

Current writer boundaries: Membership chat `01a15613-560e-7103-8d20-b71bd180ca5e`
solely owns existing auth/link/release/sign-in/callback and TL Whop/grant/linkUser/
webhook producers, plus new authority-repository/native-Whop helpers in its own
checkout. Privacy chat `01a178a8-0cec-7c72-aa8b-58506f2f3c03` owns core erasure
proposal artifacts only; no canonical apply. Shared alerts retains Community7,
owner page/Help and its sender. Coordinator solely owns migration ID/order/manifest
and hosted worker registration; product policy remains with PC feature manager.
No source synchronization or positive binding is inferred across checkouts.

The new descriptor defines exactly nine Premium queue/discovery/review/cleanup
tables, not producer authority/payment tables. It explicitly has canRegister=false
until migration allocation and erasure/retention qualification. Actual injected
SQLite adapters implement durable transactions but are dormant; constructors
open/query/migrate nothing. The dedicated runtime factory has no enabled variant.
The exact synchronous `preparePartnerAlertPlatformErasure(database,input):void`
export exists and MUST THROW while binding/schema/policy is missing. It never
returns an ignored false result, captures data, deletes records or reports a
confirmed role removal. Positive erasure remains held.

Coordinator additionally cleared EXACTLY TWO old owned Partner source successors:
`server/database/partner-alert-schema.ts` and `server/partner-alert-whop-inbox.ts`.
Stored provider-account SQL/row/FK/index names are now `whop_account_id`, avoiding
the canonical Journal `account_id` erasure selector. Offers already used the
specific name. Actual Whop payload/query `account_id` and public `accountId`
remain unchanged. Other21 earlier Partner sources and all six earlier Premium
sources remain byte-identical. This correction does not resolve owner/signer
RESTRICT graph, JSON identifiers or retention policy and does not authorise a
privacy closure exemption. [Eleventh-slice receipt](partner-alert-channels-progress.md#eleventh-source-slice--concrete-storage-disabled-runtime-and-provider-column-successors).

## Ordinary Premium permission sync — current source and corrected setup

Coordinator allocated exactly TWO additional NEW files after the read-only
assessment and intended implementation explanation:
`src/modules/platform/server/membership/platform-premium-channel-permission-plan.ts`
and `platform-premium-channel-permission-sync.ts` in that same directory.
Only those files and these two existing owned documents change in slice twelve.
All prior32 TS files, Membership producers, current app, manifest and startup remain
untouched. The separate paid-role client and notification-role API are not widened.

The pure planner calculates ordinary paid-role permissions after applying the
channel's @everyone deny/allow. It adds only surviving supported channel flags to
the zero-permission complimentary role and copies source denies. Guild nickname
and staff powers are not cloned. It reports raw extra/missing flags, including
thread-inherited capabilities; denied parent SEND does not make attachment/thread
drift harmless. Converted guild allows that would defeat another role's deny,
unknown paid destinations, excluded Partner targets, missing/obfuscated metadata,
privileged/unknown source bits, hidden-channel allow conflicts, parent drift and
unapproved category desynchronisation require review. No parent/category is edited.
This is a bounded baseline calculation, not proof for every member/role combination.

The dormant synchroniser targets only the approved complimentary role's overwrite
on explicitly designated ordinary/upgrade channels. Reads and writes default off.
It recomputes fresh native metadata, binds reviewed policy/structure/target-preimage
digests, requires a separate durable owner-scope gate, checks bot capability and
target hierarchy, persists each preimage before I/O and confirms writes by qualified
readback. It checks the entire set again at the end. Drift stops work; uncertain
writes retain durable uncertainty and cannot be reclaimed just because a lease
expires. No blind retries or automatic rollback. Actual complete native reader,
fixed-origin writer, credentials, rate coordination, durable admission/serialization/
receipt adapter and scheduling are unbound. No runtime imports or registration
were added. Membership's paid-proof producer is a separate dependency, not a
prerequisite for authoring this dormant permission planner.

**Current live setup is the separately owner-approved corrected setup.** The PC
chat saved four corrections; Coordinator independently verified all15 ordinary
grants and15 public hides, existing roles/other overwrites and69 parents preserved.
The old operation packet below and its exact-packet PASS remain historical;
matching an erroneous packet did not establish semantic permission parity.
The four earlier allow masks are superseded operationally as follows:

| Channel | Correct allow | Unchanged deny |
| --- | --- | --- |
| `1494428986317471804` premarket watchlist | `66625` | `0` |
| `1554511894419607672` post-overnight watchlist | `66625` | `0` |
| `1495071872910364902` news-scanner | `66561` | `0` |
| `1499558115383709726` Chimie recaps | `309237711937` | `2048` |

Corrected raw snapshot:
`/home/traderlink/projects/traderslink-coordinator/operations/discord-premium-role-target-postcorrection4-20261028.json`,
SHA-256 `69316971b5bc730561db8274fcaa8ebcb0553a35730b7efd290803e023115e10`.
Corrected verification receipt:
`/home/traderlink/projects/traderslink-coordinator/operations/discord-premium-final-corrected-verification-20261028.json`,
FILE SHA-256 `1e95a252c528cfce366e5bd88ab6d8d40559d125d856e728b19c083b2f001474`.
`Premium Access` remains role `1564803564306563133`, guild permissions0,
position1/unmanaged. This worker only read the named evidence files; it made no
live correction, member assignment or census. No backup/sync activation is implied.

Before eventual automation, approve the exact designation/exclusion policy and
category-sync behavior, qualify complete metadata access and provision the bot's
least required target capability separately. Current bot rights do not support
all30 targets. The earlier temporary capability proposal was not executed and is
not permanent provisioning approval. Use the current role graph; source paid role
may remain above the bot because sync writes only the lower complimentary role.
Native adapters, durable gate, appropriate permitted verification and explicit
activation remain required. [Twelfth-slice receipt](partner-alert-channels-progress.md#twelfth-source-slice--dormant-ordinary-channel-permission-sync).

## Actual Membership consumer — authored, default unbound

After one bounded read-only compatibility pass, Coordinator cleared SIX exact
owned source successors, ONE reserved new adapter and these2docs. The new
`platform-premium-current-authority.ts` is a structural injected consumer of the
actual `capture(authorityKey)` and `isCurrent(fullTicket)` APIs, not proposal names.
It imports no absent Membership implementation and copies no Membership file.
The selected V2 JSON is SHA-256
`9dd37aa77f855404481743070b980c78dde520eef2e0f4916abda1536d3f50b9`;
actual producer authority/native source hashes are
`c92739723b247588b1eb85507570a3addeb2f19bbcbe891bd22fdda2f2ae9b3e` /
`140f91d8d13320fc9a3edc8565dd647971bfac9e03fe61adb363a92fdbed7a4d`.
During coding Coordinator supplied actual V3, whose ticket/snapshot/isCurrent/native
read signatures are unchanged. The adapter now explicitly pins V3 authority SHA
`2ba773a1d4e2f94c613bd55e559c98c0c7e8a6d3813d54a427efffc5809e51ff`;
V3 manifest SHA `23936faf4c5931d8f5d2d2ee3782d2617dbaedc9a75489cab4ff9d36a561eb46`.
Its new erasure referencePlan input/planning read is outside this adapter's read
port; no erasure implementation is bound. V2 receipts remain immutable history.

Snapshots, desired intents and paid-eligibility events retain the full original
ticket: scope/revision, Whop epoch, admission reference, fact fingerprint,
observation and deadline. In-flight leases separately retain their immutable
claimed intent/ticket across newer desired work, restart and late results.
The latest physical outcome and confirmed managed-assignment receipt retain their
own originating claim/ticket; a newer capture never renews an older operation.
All current checks use the original ticket in the same real admitted immediate
writer as durable work. The adapter requires an explicit writer port; a transaction
flag or independent transaction is not admission proof. Network work stays outside.

Policy offers and bound/unbound native payer are separate. HMAC-only/no-payer
coverage stays UNKNOWN; no fake identity, empty-set nonpayment or generic grant
adoption. A valid explicit Premium gift is evaluated independently of native
qualification/payer/payment UNKNOWN and never grants paid Partner eligibility.
Both membership accessKind and each payment coverageKind must be paid_membership
for live paid evidence, alongside actual settled positive payment, explicit period
and refund/dispute qualification. Trial/free/unknown/sandbox never becomes live
paid proof. Independent valid purchases survive unrelated uncertain siblings.

Previous paid-through comes only from actual owned positive-event receipts and is
separate from freshness. Retired subjects require native retirement facts PLUS
the actual owned confirmed assignment reference, and reviewed paid-only historical
classification before cleanup. Unknown/manual history remains protected. The
existing short review row cannot manufacture actor/disposition provenance; a real
review reader is still unbound. Complimentary role membership stays owner-managed.

This is source-only: adapter disabled by default, producer/writer/history/review
ports unbound, descriptor canRegister=false, no native decoder/GET/admission/
quiescence implementation, factory wiring or worker registration. Payload retention
is explicitly UNQUALIFIED, including full tickets, original in-flight intents,
physical outcomes and assignment receipts. No positive erasure/cleanup is claimed.
Privacy's bounded actual-V3 source review closed the two earlier trigger-lifetime
and signer-union mismatches. This does not accept SQL/core closure, the whole graph,
admission/quiescence, retention/recovery or the Paid ticket payload lifecycle.
At the thirteenth checkpoint cross-recipient grants held pending owner disposition.
That product question is now resolved: retain the recipient's ordinary gift and
remove grantor identity through qualified provenance, as recorded in the later
actual-V6/V2 section. Actual erasure remains unbound; the policy decision alone
is not a positive erasure adapter.

Next: reconcile any actual producer successor, then allocate the separate Partner
full-ticket authority/fanout/role-queue slice. Its revision-only interfaces and
active/inactive/unknown Premium projection still cannot authorize V2 work. Pages,
API/OAuth/native transports, actual erasure integration, registration, permitted
verification and final UI review remain unfinished. [Thirteenth-slice record](partner-alert-channels-progress.md#thirteenth-source-slice--actual-membership-premium-consumer-successor).

## Partner full-ticket role and refresh successor — default unbound

Coordinator cleared eight existing Partner source paths plus these2docs; seven
source paths changed and the global delivery worker stayed byte-identical. No new
file, Premium/Member/provider client, runtime factory, Shared or core privacy path
changed. The original full Premium ticket is now retained alongside independent
community/offer/provider/identity/erasure context epochs and fact/admission receipts.
Shape validation is not authority; both original tickets must pass actual current
checks in the same admitted immediate writer before a role operation.

Unknown/stale/unqualified evidence yields HOLD and fresh evaluation rather than
an inferred unpaid/removal decision. A known verified paid endpoint remains
separate from freshness; its expiry cannot create extra paid coverage. Independent
valid purchases survive unrelated unknown siblings. Only live paid membership
and actual qualified payment coverage permit Partner access; an ordinary gift
never does. Community native qualification/paid coverage is explicit. The preserved
old Whop normalizer does not supply that new proof, so its output alone remains
UNKNOWN instead of being silently promoted.

The dormant combined authority composes the actual-V3 Premium consumer with
separately injected current community facts, real writer admission and a real
user-to-authority-key mapper. All ports/default enablement remain unbound/off.
User UUID is not substituted for the authority key. No native/context-generation,
identity/erasure or mapper implementation is invented. The earlier diagnostic
role/member projection stays diagnostic.

Partner desired role tickets, immutable original in-flight intents and late outcome
receipts retain both full original tickets; newer desired work cannot renew an old
claim. Managed assignment references arise only from confirmed owned operations.
Old subjects require qualified identity history and an owned assignment before
removal. Expired write leases remain uncertain. Native role adapters must recheck
the synchronous original-claim callback after their own waits, immediately before
I/O. Rate cooldowns survive refreshes; permission holds need a real policy change.

The new diagnostic refresh outbox stores the original Premium observation/expiry
event and ticket, then requests reevaluation of already-known Partner role jobs.
It never treats false eligibility, an expired event, a gift or a raw webhook as
nonpayment or role authority. Its current-principal erasure admission port is
unbound. First-subscription onboarding/native-community events remain separate
intake work. The descriptor now has20 own conceptual tables and canRegister=false.

Full-ticket/outbox/claim/outcome lifecycle and shared signer disposition remain
privacy-UNQUALIFIED. The separately cleared erasure catalog successor below now
records the new refresh table/payloads. Qualified native community Whop
normalizer/reader and the actual user-to-authority mapper remain unbound. No positive erasure,
native/provider/Discord operation, schema registration or runtime binding occurred.
[Fourteenth-slice receipt](partner-alert-channels-progress.md#fourteenth-source-slice--partner-full-ticket-role-and-refresh-fanout).

## Erasure payload catalog successor — no executable erasure

After preserving the fourteen-slice source checkpoint, Coordinator cleared ONLY
`server/partner-alert-erasure.ts` plus these2docs. The catalog now names the20
Partner tables, related nine ordinary Premium tables, and exact desired/original
in-flight/outcome/managed-assignment/refresh-event JSON identity paths and their
original UUID/admission/fingerprint/epoch/target provenance. It is explicitly not
an exhaustive root/signer closure or an actual SQL selector/command.

Both describePartnerAlertErasure and the payload lifecycle retain canExecute=false.
Only the whole-Platform command may eventually select these scopes; Journal/demo
deletion must preserve them. No new SQL, capture, redaction, cleanup executor,
retention period or signer disposition is implemented. Existing actual operation
proof must survive until real admission/fencing, writer quiescence and late-receipt
qualification plus an explicit owner retention/disposition decision permit change.
Lease expiry and a minimal cleanup receipt cannot prove full payload redaction.
Source/content/credential/backups/recovery and recipient signer references remain
separate qualification gates. [Fifteenth-slice receipt](partner-alert-channels-progress.md#fifteenth-source-slice--blocked-erasure-payload-catalog).

## Actual V4 mapper contract successor — no runtime binding

Coordinator verified Membership's concrete
resolveUserAuthority(userId,guildId) source and cleared ONLY the two existing
Premium/Partner authority consumers plus these2docs. The Premium structural read
port and wrapper now expose that exact method. The Partner combined consumer
supplies its explicitly configured guild and accepts only linked with the actual
stored key. Ambiguous, missing or unqualified mapping remains HOLD/unbound; no
user-UUID substitution, initialization, default guild/epoch, payment inference or
new Discord subject is introduced.

Selected actual V4 manifest SHA-256
`74bbc658cb7db5a349865836bfe91531abc7a6b3a0a60b1e79df7525ac0720a2`,
authority source `e83cf9b4444ee6932c66f1fcbbc16a27e526ef06f02271f67b6123196ffcca64`;
native source remains `140f91d8d13320fc9a3edc8565dd647971bfac9e03fe61adb363a92fdbed7a4d`.
Ticket/snapshot/isCurrent/native and actual-V3 referencePlan erasure-port signatures
are unchanged. The mapper runs only through real same-writer qualification and
does not replace any desired, original claimed or outbox ticket. All actual
ports remain null/disabled; no factory, producer copy, absent import, schema,
native/admission/erasure implementation or runtime wiring changed.
[Sixteenth-slice receipt](partner-alert-channels-progress.md#sixteenth-source-slice--actual-v4-user-authority-mapper-contract).

## Existing-command workflow and HTTP adapters — source only

Coordinator cleared only TWO new own server files, `partner-alert-workflow.ts`
and `partner-alert-http.ts`, plus these2docs. They compose the existing request
boundary and thirteen already-approved repository mutations; no new product
workflow, route/page/navigation, OAuth, checkout, subscriber grant, provider/native
handling or factory registration is introduced. No existing source changed.

The parser has explicit action/field allowlists, strict nested existing validators,
route-bound community scope, UUID/revision/consent checks and separate community
owner/operator command sets. It rejects browser user/permission/authority/success
proof, body idempotency IDs and arbitrary method names. The workflow requires the
request boundary's actual WeakSet-verified receipt, rechecks current actor/target,
reparses canonical payloads and delegates through a null-by-default real admitted
writer/repository binding. The binding must use the receipt's actual authority and
same DB, qualify native/config receipts and server-managed identities beforehand,
and roll back on callback error. Repository idempotency, optimistic revision,
immutable agreements and audit behavior remain authoritative and unchanged.

The HTTP adapter delegates POST origin/CSRF/session/rate/body/idempotency checks
to the existing boundary. It returns only a bounded command-result projection or
sanitized private no-store errors. Missing auth/admission/config/native bindings
stay unavailable; approval does not imply publishing/payment activation. Both
adapters default disabled/null and no actual incoming request, DB/provider method,
app entrypoint or runtime binding was exercised.

**Owner decision, 2026-10-28:** recipients KEEP ordinary complimentary Premium
when the granting admin deletes their account; remove the deleted admin's identity
from the grant record. This is settled policy and never qualifies paid Partner
access. The producer must implement qualified nonidentifying original grant
provenance while retaining the real recipient entitlement/terms. The V5 handoff
currently declares a new redacted-gift port but does not implement it; it is not
usable proof or permission to change the frozen gift consumers. No fake actor,
generic owner_grant promotion or naive NULL-to-UNKNOWN access loss is accepted.
Actual erasure/admission/recipient/quiescence/payload qualification remains held.
[Seventeenth-slice receipt](partner-alert-channels-progress.md#seventeenth-source-slice--existing-command-workflow-and-http-adapters).

## Private repository read-model — projection only

Coordinator cleared only the new `server/partner-alert-read-model.ts` and these2docs.
It projects existing authorized readPartner(owner|partner) and operator review-queue
results into explicit private fields, with existing content/offer/terms validators,
bounded arrays, tenant/version consistency and recorded-quote validation. States,
amounts and query order remain unchanged; no acceptance/payment/native-proof status
is inferred. The server output-bot identity, actor IDs, raw SQL rows/JSON, credentials,
audit/erasure/ticket payloads and arbitrary fields are omitted. Whop fields in the
parsed offer are existing configured account/product/plan references only.

This is a pair of pure projection functions, with a type-only repository reference:
no repository call, new service/port, auth, SQL, provider, route/page/UI or public/
subscriber data path. The caller must first perform the real authorized private
read; DTO projection is not authorization. Current-baseline runtime auth/owner/
community binding and Coordinator-selected route ownership remain the concrete
next read/API dependencies, not another speculative adapter layer.

The actual V6 gift implementation has now been relayed by Coordinator; one bounded
source/API compatibility pass follows this frozen checkpoint. Gift consumers remain
unchanged until that pass and exact correction allocation. V2 gift capture/current
must be paired with its original V2 ticket; no V1/V2 cast or positive erasure binding
is inferred. [Eighteenth-slice receipt](partner-alert-channels-progress.md#eighteenth-source-slice--pure-private-read-model).

## Actual V6 producer / V2 gift consumer adoption — source only

After the read-model checkpoint, Coordinator cleared only the existing Premium
contract/evaluator and current-authority adapter plus these2docs. The adapter now
selects actual captureV2/isCurrentV2 and requires the returned
apiVersion=platform_premium_authority_v2. No V1 snapshot decoration, fallback or
V2-ticket cast into V1 native methods exists. The transient existing-key mapper
remains unchanged. Queued desired/event/original in-flight/outcome tickets retain
their full original bytes/fields; a V1 fact digest fails the V2 checker, and only
new desired work can use an independently captured V2 ticket.

Active ordinary gift evidence now has entitlement ID and explicit live-signer or
qualified-redacted-signer provenance. The complete actual receipt is whitelisted
and bound to recipient/authority/grant/entitlement, original intersected periods,
protocol/disposition, real references and recorded post-redaction epochs. Later
epochs may advance; equality to an old redaction epoch is not invented. No fake
actor, generic owner_grant/NULL adoption, external-payment promotion, receipt
issuance or term extension. Unknown/unqualified gift evidence keeps ordinary
access UNKNOWN even when independent verified paid coverage has ended. Gift
access remains ordinary-only and cannot qualify paid Partner channels.

Selected V6 authority source SHA
`577315a40178507b88a14c487351112a680b024362c5c0fca40f6f183b732e4a`;
native remains unchanged. Coordinator reconciled the privacy source successor
`3d132bf98852c13fd48fb46f04f7cce0350221af11c4b533be6a8264bf14972e`
as a narrow future-start correction, with the prior pin preserved. That is source
availability, not native/graph/retention/execution acceptance. Real V2 schema,
issuer/current proof, admission, quiescence and recipient/payload disposition
remain unqualified/null/off. No native or erasure implementation is bound.
[Nineteenth-slice receipt](partner-alert-channels-progress.md#nineteenth-source-slice--actual-v6-v2-gift-consumer-adoption).

## Read-auth requirement separation — no positive composition

Coordinator allocated ONLY the existing
`src/modules/partner-alerts/server/partner-alert-platform-authority.ts` and
these two owned documents for slice twenty. HTTP, runtime, repository, request
boundary, read-model, schema and all existing shared-auth exports remain unchanged.
No new source file or injected port was added.

`PartnerAlertPlatformReadBindings` now names the same existing identity resolver,
identity options, admin authorizer, community/Discord repositories, clock, freshness
limits and destination guild requirements without the three mutation-only callbacks.
The existing `PartnerAlertPlatformBindings` retains all of those requirements PLUS
required `verifiedResources`, `verifiedWhopOffer` and `qualifiedPricing` callbacks,
so existing mutation request bindings remain strict. Existing `forRequest` accepts
either shape. Its body and the signed-in-user/operator/community/ownership/freshness
checks are unchanged, including real operator authorization and its audit behavior.

When a mutation-only authority method is called without its native/config callback,
it throws `PartnerAlertValidationError` with `requestAuthority`; it does not return
a permissive receipt, price capability or stub. Existing ownership/guild checks
still run before the guarded resource/offer call, and signed-in validation still
runs before pricing. Supplied callbacks retain their existing invocation semantics.
The combined paid-role authority below the request adapter remains byte-identical.

This removes an unnecessary type requirement for eventual authorized settings reads;
it does not implement a GET entrypoint, request factory or positive read binding.
The selected baseline still needs actual same-connection current-session/erasure
admission and concrete DB/config/schema receipts. The inspected identity resolver
opens a separate `withPlatformDatabase` connection; a captured deadline or
`db.inTransaction` does not supply the missing admission proof. Operator authorisation
can write an audit record even on a GET. HTTP/runtime proposal paths remain
unallocated. No mutation receipt is reused as read authorization. Source-only
manual review and byte-preservation checks were performed; all executable checks
and runtime/DB/provider/Git actions remain unrun under the existing task constraint.
[Twentieth-slice record](partner-alert-channels-progress.md#twentieth-source-slice--read-auth-requirement-separation).

## Actual private-request writer — authored, not wired

Coordinator assigned ONE NEW path only:
`src/modules/partner-alerts/server/partner-alert-request-writer.ts`, plus these2docs.
All38 prior TS, actual shared auth/Member/privacy/Shared source, HTTP/runtime,
repository, schema and migration pins remain unchanged. This is source slice21;
no additional source path, injected authority port or generic admission issuer.

`PartnerAlertRequestWriter` construction is inert. Its synchronous `run(request,
operation)` uses the provided application DB and explicit server configuration.
It first invokes the actual existing authenticated identity resolver, preserving
its ordinary signed-in policy, then opens its OWN actual IMMEDIATE transaction on
the provided DB. The outside identity alone never authorizes the scope. Inside,
actual `PlatformSessionRepository.findActiveByTokenDigest` verifies the live token,
active session, active identity and active user. Actual authentication/workspace
repositories plus small scoped SELECTs bind the exact login subject, stable user,
session, unique active workspace membership/current role and active workspace.
No account-owner or journal-admin requirement is imposed on ordinary requests.

The original single session cookie is strictly decoded and hashed using the
existing session export; malformed/duplicate cookies fail. Original headers,
request object, owner instance and actual DB connection are bound to a private
in-process WeakMap. Unrelated preexisting transactions are rejected without being
adopted or rolled back. Only the same owner's genuine active request on the same
connection can nest. Identity/session/workspace/role/link facts, abort state and a
monotonic bounded clock are checked at entry, every guarded read and before
results/commit. Optional Discord evidence is rehydrated on the admitted connection;
the selected canonical resolver accepts Discord/Google/email login, and an absent
Discord link alone does not invalidate an ordinary signed-in request.

The module builds actual existing Partner authority and repository internally,
with actual admin/community/Discord repositories on that same connection. It
exposes ONLY guarded `readPartner` and `listReviewRequests` support in the live
callback. No raw DB, token, captured identity, actor, full authority/repository or
native/config/erasure/Premium proof is exposed. Existing repository authorization
still runs; actual operator audit/rate-limit and community-owner checks remain
inside the transaction. Used operator/community authorizations are repeated before
commit through the actual existing methods, with their normal audit/rate-limit
effects. Later runtime qualification must include the resulting read-rate budget.

Only detached plain synchronous result data may leave: promises/thenables,
functions, class objects, getters, cycles and capabilities are rejected without
calling then/toJSON/getters. Result copying has bounded depth/nodes. Any caught
nested or guarded failure poisons the outer scope. Every exit revokes the capability
in finally; leaked read handles fail before touching the DB after the scope ends.
The transaction wrapper rolls back its owned work on failure. Trusted callbacks
must not perform I/O or manually end/replace the native transaction; no DB handle
or transaction control is supplied by this API. This is not a sandbox for arbitrary
server code that already independently owns the application's DB.

This implements bounded Partner-private-request admission only. It is NOT the
Membership Premium V2 writer, automation admission, source/config/schema receipt,
native provider binding, privacy erasure admission/cleanup or a waiting global
purge lock. It does not change factory `canActivate`, install a route or register
any worker. Actual target-specific baseline/carrier/schema/config qualification,
independent source review and later permitted verification remain required.

### Referenced actual source pins — not a transitive runtime acceptance

Canonical references below were read at
`/home/traderlink/projects/traderlink-platform`; imports are authored for those
actual exports. The preserved checkout has older resolver/session-service/admin/
community whole files. Their APIs may match while behavior differs: in particular
its old resolver is Discord-only. No old file was copied, edited or described as
the current runtime. The current source must be selected by Coordinator's eventual
carrier; this preserved source is not invoked or claimed compatible as a whole.

| Exact relative path | Selected canonical SHA-256 | Preserved SHA-256 / equality |
| --- | --- | --- |
| `src/modules/platform/server/authentication/require-platform-request-scope.ts` | `e845c22963a5fff9cdb8399e1060274c00715c36ca619efc0363ee63625318ed` | `43d1ba7b20b1e352b1f4295aee518a35b6dc6525aaeaa1fe28502f4a408653b2` |
| `src/modules/platform/server/authentication/platform-session-repository.ts` | `aa76ac103cd6ebfa9369bbe66fe7c897e12aa8bc7fec4c0eda7b4f241929c74c` | Same bytes |
| `src/modules/platform/server/authentication/platform-session-service.ts` | `3c106e1f1b8a7a09d49e4601f4a4380cdfc77a9bb46875d8ca3acbb1d525ceda` | `29fc187340d6965c84b71a06fff2f528dade8284fffaab6fb345531f96001c3f` |
| `src/modules/platform/server/identity/platform-workspace-repository.ts` | `8b592218c9c1b75e1b5c5efb18a46e98ed81a561fa190c1f038dfe2e7f8fbdfb` | Same bytes |
| `src/modules/platform/server/administration/platform-admin-authorization.ts` | `88b9418612cb2ed52adc81d9966f30b94a5d4729114b96d2ce7a75796a2aad37` | `38c62ddef204b52d77da297b91460052e24788c4123f28874fbabbe57b10fa7a` |
| `src/modules/platform/server/authentication/platform-authentication-repository.ts` | `bae51ba379b0747f7400ac436b58f76dbab4f902a4344a8a180733ed1ee05f7b` | Same bytes |
| `src/modules/platform/server/authentication/platform-discord-membership-repository.ts` | `4facebce52fac79ae01ad26f7ee4788a1deab15829548194891b2224370d107c` | Same bytes |
| `src/modules/platform/server/authentication/platform-discord-configuration.ts` | `7a05989ae22157c1dd9b1a3d639d070e0bec9df18717f1719c40a82f5d4ecea3` | Same bytes |
| `src/modules/communities/server/traderlink-community-repository.ts` | `35e0971c22df0e8966a283acd913d76e73db316d7d55020aa0c53d88dcb0892f` | `6b5d905f131b97890da4a7a94a6f33f913e56c37d32c919b63c6ba30d02e46cd` |

Manual counterexamples and unrun-check boundaries are in the
[twenty-first-slice record](partner-alert-channels-progress.md#twenty-first-source-slice--actual-private-request-admission).

## Independent content-filter completion — no Auth dependency

Owner/PC relay directed continued real implementation wherever independent of the
frozen request-writer correction. A full pass over the approved plan and39-source
inventory identified content filtering as an immediately implementable slice.
Coordinator independently checked/allocated ONLY existing
`src/modules/partner-alerts/contracts/partner-alert-content-policy.ts`, preimage
`0cfe2c8b5b3332e27cbeeac9d10f97883869b93f1968b7a601c8015349667266`,
plus these2owned documents. No new source file/API/port or owner policy choice.
All38 other TS, including frozen writer `ed7c1a81ef86497409354b52af1b52027d4a65dcc32712e72bbadabc146b9fa8`,
remain byte-identical. Auth/Coaching/shared pins and all runtime files are untouched.

The existing exported `evaluatePartnerAlertContent` is already called by actual
`PartnerAlertIngressService.persist`; ingress source SHA-256
`a81e47dec35c61551115e5d9df376116903c4279624acd3de4e843db54bdfa94`.
Its existing policy parser/contract APIs remain unchanged. The filter now recognises
explicit generic `scheme://` app/file links, whitespace-delimited spelled `dot`
separators and Unicode domain-dot separators in the detection copy. Existing
percent/entity decoding runs before the new checks. Known non-`//` schemes and
old link/invite detectors are retained. No promotion phrases or issue codes were
added. Only matching is normalised; whole flagged posts receive the existing
`link_or_invite` hold, and allowed text/chunks remain exact original source.

Ordinary colons, decimals and ticker punctuation are not interpreted as generic
URI schemes; the new scanner requires `://` with a valid leading scheme letter.
The existing bare-domain heuristic is unchanged, including its possible ambiguous
text holds. Spelled/Unicode domain detection is heuristic and may require review;
this does not promise recognition of every disguised link or promotional message.
No links are resolved or visited and no DNS/TLD/network dependency is introduced.

Added work is bounded by the existing32,000-character input gate. Spelled-dot
matching uses fixed-width whitespace lookarounds. The explicit URI scanner moves
forward over `://` delimiters; each backward scheme scan stops at the preceding
separator slash, so scanned scheme ranges cannot overlap. New work is linear in
the bounded detection text. Existing normalisation, decoding passes and regexes
are unchanged apart from the two separator-normalisation replacements. Chunking
and the complete evaluation/messages suffix are byte-identical to the preimage.
Manual examples are documented; no tests or utility/module execution was run.

### Full approved inventory review — next actual dependencies

| Feature area | Current source and remaining dependency |
| --- | --- |
| Private settings/approvals | Repository, DTO and workflow authored; writer21 frozen on real Auth audit/rate defects; actual HTTP/runtime wiring and exact routes unallocated |
| Pricing/agreements | Standard/private versioned exact pricing authored; actual owner Whop native coverage/scopes and accepted commercial values still needed for activation |
| Subscriber paid access | Combined paid-only policy/tickets/queues authored; qualified native community paid-period proof, current subject/context, actual transport/schema/config binding still needed |
| Ordinary Premium | Actual V6/V2 gift consumer and queue/permission logic authored; producer/admitted-writer/native/history/retention bindings remain separate |
| Incoming content | Full-post text/media/author policy and ingress authored; this slice completes existing explicit URI/domain-obfuscation matching without core Auth |
| Gateway/delivery | Receiver and revision/outbox workers authored; actual socket/resource transport, qualified credentials/gap recovery, schema and worker registration remain unbound |
| Privacy/retention | Catalog/obligations authored; actual owner-qualified retention/closure/recovery and Auth outcome contract remain separate, with no fake positive proof |
| UI/Help/release | Existing planned journeys retained; exact page/API/Help ownership and real data/auth binding needed, UI review at end and release owner-controlled |

### Frozen request-writer review correction — no policy-parity acceptance

Coordinator preserved checkpoint21 at
`operations/paid-twenty-first-source-checkpoint-20261028.tar.gz`, SHA-256
`272fef1da6637e40b0058c9ebefafb661877cc7ec137528110fcfdb41194326a`.
Its independent SOURCE review found two concrete defects: the final operator
reauthorization doubles real process-global access-rate/audit effects for a single
read, and throwing from the owned transaction rolls back the actual denied audit
(and an allowed audit if later request processing fails). Earlier preservation
claims above describe authored intent and are superseded by these findings.
No executable check passed and the writer remains frozen/inactive.

Actual current `PlatformAdminAuthorization.authorize` couples policy, rate charge,
audit append and denial throw. No exported side-effect-free final-decision validator
or rollback-safe genuine denial outcome exists in the inspected API. A faithful
same-file Paid successor requires an actual Auth-owner contract/allocation first;
no private policy was copied, rate counter reset, unqualified cached grant issued
or audit replay invented. Coordinator received that concrete gap/proposal.
The independent content change does not resolve or hide either defect.
[Twenty-second-slice record](partner-alert-channels-progress.md#twenty-second-source-slice--independent-content-filter-completion).

## Exact-base Auth parity API proposal — no source apply

After PC Coach closed51/T08/S07 and confirmed no reservation on the current
administration source, Coordinator allocated ONE immutable technical patch proposal
only, plus these two owned documents. The new
[Auth API proposal](partner-admin-auth-policy-parity-proposal-20261028.md) targets
canonical `src/modules/platform/server/administration/platform-admin-authorization.ts`
SHA-256 `88b9418612cb2ed52adc81d9966f30b94a5d4729114b96d2ce7a75796a2aad37`.
Its preserved same-path file remains different at
`38c62ddef204b52d77da297b91460052e24788c4123f28874fbabbe57b10fa7a`.
Neither file, any of the39 feature TS, writer21/content22, shared52pins, runtime
or migration source changes. This does not count as a23rd implemented source slice.

Immutable proposal document SHA-256:
`84e5c2c52420587f32f0ec5b2df493b9a415f62bbc7fbf5eb80abdf21c235050`
(30,254bytes/569lines). Embedded401-line unified diff payload SHA-256:
`b55eedab0a906cfc804c87563d2d29724146a5f62850f7949252b66917bf63e8`.
Proposed unapplied437-line postimage SHA-256:
`383e73ab1cf60ec4539b32239db10cbe53e2d451e6040ea574b5023e3fe59340`.
These are byte identities of a document/diff/candidate, not compile/apply acceptance.

The proposal factors actual Auth owner/grant/membership/development policy once
inside its own file and preserves immediate public `authorize` rate/audit/error
behavior. New `withRequestAuditFrame` would own an outer transaction on the actual
caller DB, isolate protected work in a savepoint and privately capture genuine
Auth audit inputs. Its issued frame authorizes a real attempt once; `revalidate`
accepts only the original in-frame scope and reruns the same actual policy without
a second budget charge or duplicate allow event. Original scope/timestamps are
not renewed. A newly denied final policy evaluation produces a genuine denial;
a mere binding change does not fabricate a policy audit.

Only after confirmed rollback of failed private work may its captured actual audit
outcomes commit in the outer transaction, then the original failure is thrown.
Successful private work and audits commit together. Audit/rollback/commit failures
return no result and cannot be labeled durable. In-process outcomes are not a
crash-durable store; a process loss before outer commit can lose pending effects.
No policy callback, audit replay/scraping, budget refund or default positive receipt.

This is a technical proposal, not actual Auth implementation/ownership or product
policy approval. The existing writer21 cannot nest its old transaction beneath it;
a later separately allocated successor must use the actual reviewed Auth-owned
outer frame, retain real same-connection session/workspace/actor/Discord freshness
validation, bind frame authorization for real attempts and revalidate original
qualified scopes at completion. The new API is not generic session/erasure/Premium
admission or schema/configuration qualification. No code is wired or activated.

Manual review compared actual predicates/order/audit fields, unchanged configured-
owner helper and unchanged public wrappers. No tests/type/lint/build, module import,
SQL, Git apply/check/mutation, provider/runtime/preview/release were run. Coordinator
must independently review the immutable artifact before any apply or source handoff.
[Proposal progress record](partner-alert-channels-progress.md#auth-policy-parity-api-proposal--documentation-only).

## Product outcome and confirmed choices

An already connected community requests one or more mappings from existing
community Discord channels into dedicated owner-approved TradersLink Discord
channels. Every source/destination mapping is individually approved. Community
ownership, publishing approval, subscriber entitlement and Premium are separate.

- Communities pay the TradersLink owner's Whop account a standard first-channel
  fee plus additional-channel fees. Private negotiated agreements can override
  amount, currency, cadence, included channel count and additional-channel rate.
  No hard-coded price or mandatory provider price cap. Version accepted terms;
  never silently rewrite an existing subscription charge.
- Subscribers pay the community's own Whop account. TradersLink does not charge,
  hold, transfer, split or refund those funds. No connected-account platform
  payout or commission model is part of this feature.
- Launch supports individual channel prices AND optional packages chosen and
  priced by the community. A package contains only that same community's channels;
  a shared owner does not permit cross-community packages.
- Premium plus the relevant paid community subscription is required. Premium
  means CURRENT PAID Platform TradersLink Premium for Partner channels, not a
  Discord marker. A free trial, no-payment checkout, automatic owner/nonproduction
  bypass, grant or lifetime source does not qualify there. Paid Premium lapse
  pauses all Partner access while the community Whop subscription continues.
  Intentional owner complimentary Premium for ordinary channels is separate;
  it never satisfies paid Partner eligibility. Explain independent billing.
- If the community stops paying TradersLink or stops publishing, pause new sales
  through TradersLink and publishing. The community handles cancellations/refunds
  and stopping affected sales on its own Whop account. Verification-only authority
  cannot disable external checkout links. Do not claim it can.
- On community subscriber coverage ending or a policy-qualified confirmed
  invalidating refund/dispute, remove its dedicated access; preserve another
  independently qualifying paid purchase. During a partner publishing-payment
  lapse/pause, retain prior alert history only through the subscriber's verified
  community-paid term while TL Premium also remains paid. Stop sales/mirroring.
- Community-owner TL account deletion pauses new sales/publishing. Resume only
  with an owner-approved replacement and qualified setup; never silently transfer
  ownership. Preserve durable external cleanup and minimal reviewed audit retention.
- Destination channels are read-only. Text only: no links, images, attachments,
  embeds, stickers, polls or interactive components. Detect server names/aliases,
  invites and promotion. Hold questionable posts; do not strip meaningful alert
  sentences or claim a heuristic detects all disguised promotion.

## Current evidence and Shared alerts boundary

Assigned canonical inspection found community identity/ownership, publication
delivery, Platform membership and coaching Whop code. Those are later integration
candidates, not authorisation to import an old runtime. Existing coaching Whop
flows include connected-account markup/payment writes inappropriate to this
verification-only subscriber integration.

Shared alerts chat `01a15610-c892-7a83-8d78-d6662b7a9353` confirmed its distinct
contract: alerts published THROUGH TradersLink to individually agreed receiver
Discord channels, full multipart content, publisher-specific grants, receiver
approval/pause/stop and linked corrections/withdrawals. It does not ingest arbitrary
Discord posts, bill subscribers or manage monetised channel access. Its frozen
35-file historical integration still awaited authenticated browser/owner review.
Preserve its routes, grants, consent, schema and delivery semantics. Never infer
its grants authorise incoming Discord content or paid subscriber access.

## Identity, Whop verification and role control

Community authorises minimal Whop membership-read/event access to its own account.
Member links a verified Whop identity to their stable Platform identity; never
match on display name, email alone or payment screenshots. Bind provider facts to
environment, merchant account, approved product/plan, offer version and member.
Current signed webhook notifications schedule authoritative membership retrieval;
duplicate/out-of-order events cannot directly manufacture access. Reconciliation
also handles missing events, lost app authorisation and subscription expiry.
Request no subscriber charge/refund/cancel/payout permissions.
List prices and a checkout return do not prove money was paid. A paid basis must
come from a bound settled-payment read/receipt for the membership's paid period,
with refund/dispute state checked; membership state alone cannot upgrade a free
grant into a paid purchase. This may require minimal read-only payment evidence
permissions in addition to membership reads. No payment-management authority is
requested. Exact scopes/native API contracts remain to be qualified.

Only the TradersLink bot assigns dedicated destination access roles. A Whop bot
or community owner must not assign them. Separate Premium and partner roles do
not produce an AND gate in Discord: evaluate the complete condition first, then
materialise one dedicated per-channel access role. Union qualifying individual
and package subscriptions before deciding removal, so cancelling one overlapping
purchase does not revoke another. Use explicit current Premium evidence; existing
global enforcement-off, guild ownership, a plan label or arbitrary paid membership
must not imply Premium. Exact current membership mapping needs integration review.

Concrete destination setup for that gate:

- Keep the community's Whop Discord-role integration in its own Discord server.
  Its read-only account connection to TradersLink does not require its role bot
  to be installed in the TradersLink destination server.
- Deny ordinary members access to each private destination channel. Grant view
  and history through its dedicated channel role only; Premium, generic Whop,
  community and direct-member overwrites must not separately allow access.
- Put dedicated roles below the TradersLink bot and above any other bot with
  role-management permissions, or remove that other bot's conflicting permission.
  Another bot with Administrator is not a qualified destination setup.
- Deny ordinary subscriber posting, replies/threads and other interaction
  permissions according to the final read-only policy. Audit actual effective
  category/channel permissions on setup, before role grants and after changes.
  The runtime must pause grants and surface permission drift.

This separates verification from money handling while closing ordinary role
bypasses. It cannot override the Discord server owner's or administrators'
native powers, or force the community to stop external Whop billing.

Recheck server membership, role/channel permissions, role hierarchy and identity
before applying an intent. Do not accept stale/future or foreign-community facts.
Finite verified periods bound access. Outages cannot grant indefinite access.
Observed absent/invalid facts revoke; uncertainty follows only an explicitly
configured finite freshness policy. Operator grants are not subscriber purchases.
Publishing-pause does not itself revoke an otherwise valid paid subscriber role;
suspension, security lock or mapping withdrawal does. Owner/PC direction now
confirms paid-history retention during publishing pause, bounded by BOTH actual
paid terms; this is no longer an unanswered product choice.

The access-role source retains separate old-Discord-subject removal jobs through
unlink/relink. A new identity waits for those removals to be confirmed. Grant
evidence is refreshed before an add and generation/deadline/lease is rechecked
after destination verification and before the write. A newer revocation cannot
be replaced by the completion of an older grant. Unknown or crashed role writes
remain visibly unresolved and block conflicting operations: a simple role GET
does not prove that an older request cannot still arrive. A later qualified
transport/operator reconciliation must prove the old operation has settled before
resolving that state. No automatic resolution adapter is authored or enabled.

## Ordinary Premium backup — owner correction and proposed design

Owner approved a TradersLink-bot backup for the configured ordinary Premium role:
detect missed Whop removals, remove a confidently classified paid role after actual
paid coverage ends, and restore on verified successful current payment. Owner then
clarified that some manual Premium assignments are intentional FREE gifts. This
correction supersedes blanket stale-manual-role cleanup. No missing Whop payment,
manual assignment, missing Platform login or incomplete lookup proves nonpayment.

Keep three classes: (A) verified paid Premium; (B) explicit owner-authorised
complimentary ordinary Premium; (C) unknown historical assignment requiring review.
Manual assignment does not exempt a confirmed paid member from eventual expiry,
and it does not make an unknown member unpaid. Inventory/review precedes any
historical transfer or cleanup. Do not bulk-remove unknown manual holders.

Owner now APPROVED a separate neutrally named role for the same ORDINARY Premium
channel access. The Discord name must not reveal free/complimentary status;
`Premium Access` has no collision in the verified live snapshot. The owner will
assign intended recipients before go-live; this chat must not assign members.
Creation/configuration is limited to the NEW role and its ordinary-channel
overwrites, with Coordinator as sole live operator. No existing-role mutation is
authorised. Server owner-grant identity, provenance, selected Premium scope and
optional expiry remain necessary integration design. Neither the new role nor
its free grant qualifies for paid Partner channels. Ordinary access may be satisfied by paid OR explicit complimentary
access; Partner access remains paid TL Premium AND paid community coverage.
If paid and complimentary terms overlap, ending paid coverage cannot silently
erase the complimentary ordinary entitlement. A reviewed migration must resolve
that shared-role case before automated role deletion.

Existing source interaction: `PlatformMembershipManagement`'s `grant` command
creates `owner_grant` through `PlatformMembershipRepository.grantEntitlement`,
with actor/user/plan version, start, optional end, reason and audit. It charges
nothing. The same source type is also used by its manually confirmed external
claim path. Therefore `owner_grant` alone proves neither paid Premium nor a
specific Complimentary Premium intention. The selected plan/scope and explicit
owner provenance must be checked. Aggregated `readEffectiveAccess` merges sources;
it cannot supply the paid-vs-complimentary distinction. Preserve ordinary gift
access while the paid-only Partner reader excludes it. Automatic operator,
guild-owner and nonproduction bypasses remain insufficient commercial evidence.

The bounded reconciler design below is now partly authored in six dormant files;
current adapters/store/discovery/fanout remain unimplemented and nothing is live:

1. One explicit configured guild, ordinary Premium role and TL bot identity. Keep
   the ordinary role separate from dedicated Partner roles. Fail on ambiguous
   ID aliases; never select a mutable role name for a mutating job. The existing
   notification-role API intentionally manages notification roles only; do not
   widen its allowlist or reclassify notification roles as billing authority.
2. Union actual configured-role holders (including manual holders), known verified
   current paid members missing the role, explicit complimentary grants and prior
   Discord subjects needing cleanup. Use paginated resumable census epochs,
   maximum pages/reads/time per run and a single lease. An unfinished census is
   never absence or cancellation. Existing notification directory filters by
   notification roles and is not a complete Premium inventory contract.
3. Resolve stable Discord IDs to verified Whop payer/Platform identity and selected
   Premium purchase. No name/email/screenshot matching. Members who never used
   Platform login require a qualified provider-to-Discord binding or reviewed
   identity repair. Unknown/ambiguous matches enter review; no inferred free grant,
   paid grant or unpaid status. Capture paid/complimentary/unknown classification
   and provenance before any migration/removal. No inventory was run by this chat.
4. Read authoritative current native membership/payment coverage outside database
   writes. Require actual paid coverage, not `active`, `trialing`, `past_due`, an
   advanced renewal date, event receipt or `no_payment_required` alone. Do not
   manufacture paid-through from payment time plus plan duration. The exact
   successful-receipt-to-covered-period relationship remains provider-qualified
   integration work, including late retries and overlapping paid subscriptions.
5. Retain genuinely paid access until verified paid-through even if one charge
   fails. Do not add a retry grace period after it. Fresh successful renewal must
   cover the current term before restoring; stale successes and checkout returns
   cannot undo newer revocation. Cancel-at-period-end alone does not end already
   paid coverage. Confirmed immediate termination or invalidating refund/dispute
   follows the qualified provider/policy evidence.
6. Stage native reads, then recheck identity/generation, paid or complimentary
   source, policy and erasure fences under the writer lock. Persist minimal
   evidence, desired action and bounded job lease. Known paid-term deadlines
   schedule recomputation independently of webhooks; periodic reconciliation
   catches missed events and role drift. Premium paid lapse fans out to every
   managed Partner channel, even while ordinary complimentary access continues.
   A restored paid Premium term restores only Partner purchases still independently
   paid. No global grace or free access to Partner channels is introduced.
7. Use idempotent per-role PUT/DELETE for the configured ordinary role and explicit
   dedicated Partner roles only. Preserve staff/public/unrelated roles. Never use
   a full-role-list replacement, remove-all-roles or kick as billing cleanup.
   Recheck authority before restoration; preserve old-subject cleanup on relink.
   Failed/unknown outcomes stay outstanding with bounded retry/backoff and operator
   attention. No attempt is called a confirmed removal. Erasure cleanup must
   survive deletion of user/mapping rows and automatic user/workspace roots.
8. Whop and TL may share ordinary-role maintenance under matching eligibility
   settings. Detect external re-grants that contradict paid/free classification;
   do not permit competing grant loops. Whop trial/past-due/cancellation access
   settings must be qualified. Dedicated Partner roles remain TL-controlled only.
   Both bots require valid hierarchy/permissions. Discord administrator powers,
   API outages/rate limits and delayed jobs prevent a zero-delay guarantee;
   application eligibility expires on time, actual role removal needs confirmed
   Discord I/O. This operational limit is not a billing grace period.

Primary checks: Whop's [current recurring-payments guide](https://whop.com/blog/recurring-payments-guide/)
describes a five-day retry flow with configurable access during retries. This is
not proof of this owner's setup. Its [Membership schema](https://docs.whop.com/api-reference/beta/memberships/retrieve-membership)
distinguishes billing periods, scheduled cancellation and past-due state. Native
fields/config must be qualified; no fixed retry duration becomes our expiry rule.

Whop's deprecated social-account endpoint points to [External Accounts](https://docs.whop.com/api-reference/beta/external-accounts/list-external-accounts).
That read supports user/account scope, platform and trust filters. Merchant access
to buyers' Discord links is NOT established here; treat it as a discovery candidate
requiring permission/ownership qualification. A platform badge/`verified` flag is
not sufficient payer identity proof. Do not infer no payment from missing links.
Public docs now show a newer dated example on that endpoint; the authored module's
`2026-10-27-2` pin is unchanged and not automatically upgraded or qualified.

Membership owner was contacted at `01a15613-560e-7103-8d20-b71bd180ca5e`;
Coordinator confirms no existing ordinary Premium reconciler assignment, while
Membership billing/auth/UI source remains owned and preserved. Coordinator has now assigned/authored NEW
ordinary Premium paths in the preserved checkout ONLY: `src/modules/platform/contracts/platform-premium-access.ts`
and under `src/modules/platform/server/membership/`:
`platform-premium-paid-evidence.ts`, `platform-premium-role-repository.ts`,
`platform-premium-whop-reader.ts`, `platform-premium-discord-client.ts`,
`platform-premium-role-reconciliation.ts`. Complimentary role/grant/migration
contracts/queue/client/orchestration are authored in that exact six-file slice;
current grant/identity/provider/store/erasure adapters remain unassigned. Role
setup follows the separate Coordinator-controlled direct Discord UI operation.

Shared ownership needed before implementation: current membership Whop/paid
writer and `app/api/webhooks/membership-whop/route.ts`, current identity/link
generation writers and Discord callback, canonical erasure command/service,
and Coordinator-allocated schema/manifest for evidence/role outbox/cleanup.
Membership chooses concrete API/evidence contracts; Partner consumes strict PAID
Premium evidence and retains dedicated channel-role handling. No auth callback,
general membership grant, notification role API, provider config or current app
was changed. New source/files/operations are not cleared by this planning update.

## Neutral ordinary Premium role — live read-only preflight and proposed operation

Historical packet: the current corrected setup and four superseding masks are
recorded above under [ordinary Premium permission sync](#ordinary-premium-permission-sync--current-source-and-corrected-setup).
Partial setup statements and original masks below describe earlier checkpoints.

Owner approved this setup through PC relay; Coordinator remains the live
operation coordinator. The following is the original read-only preflight and
proposed operation packet, NOT a current execution receipt. At preflight there
were zero writes/no census and no new role ID. During the later six-file source
slice, Coordinator reported new `Premium Access` role `1564803564306563133`
created and native-verified (permissions0, position1, hoistfalse, mentionablefalse,
unmanaged), with existing role fields/relative hierarchy preserved. Only 1of30
new-role overwrites was then independently verified: welcome channel
`1433849441437225050`, type0, allow0, deny1024, prior entries/parent unchanged.
PC remains sole UI writer for the other29. This attributed partial checkpoint is
not completion of the channel setup or activation of paid-role backup. The worker
did not operate Discord. Do not read
the historical proposed/unexecuted statements below as current live-state claims.

Evidence: Coordinator's named owner-private token-free file
`/home/traderlink/projects/traderslink-coordinator/operations/discord-premium-role-target-20261028.json`,
SHA-256 `d14a47d1de3fa2e8e7e6dab71e34fa03e73c44bd6598a6c3c1182415ac12567f`,
observed `2026-10-28T00:30:16.170Z` UTC. Its 33 roles/69 guild channels identify
configured/live guild `1433570740430573642`, configured Premium role
`1433600517463871773` (currently `Premium Members`, position 31), and Platform
bot/application `1540380904705495090`. The bot's only assigned managed role
`1558557918171762721` is position 15 with guild permissions `268435456`
(Manage Roles). No current role is named `Premium Access`. The configured
Premium role is verified by ID; historical `Trade Alerts` naming and actual Whop
product-to-role linkage remain UNVERIFIED. Whop configuration names are absent
from the supplied snapshot; absence is not proof that no external linkage exists.

**Execution prerequisite:** existing bot permissions cannot safely reproduce this
map. Fourteen of the 15 target channels deny it View Channel; halt-alerts has a
member-specific bot view allowance. Several target overwrites also deny Manage
Roles. At guild level the bot lacks Embed Links, Attach Files, Create Public
Threads and Send Messages in Threads, which paid Premium supplies. It cannot
manage the existing paid role above it for the future backup reconciler either.
Coordinator must identify an already-authorised capable operator, or return the
precise permission/hierarchy prerequisite to the owner. This proposal does NOT
authorise elevating a bot, moving existing roles, granting Administrator, changing
existing bot/member overwrites, substituting Whop credentials, or creating a
partially configured role while those prerequisites remain unresolved.

Proposed `POST /guilds/1433570740430573642/roles` body:
`{"name":"Premium Access","permissions":"0","hoist":false,"mentionable":false}`.
Explicit zero is required because omitted permissions default to @everyone's.
No role-position PATCH, staff powers, custom icon/colour, or member assignment.
A newly created low role remains below the current bot; server owner/admin powers
and other independently held roles are unchanged. Before creation recheck name,
guild, current roles, exact channel preimages and actor capability. A timed-out
POST must not be blindly retried: reconcile returned role/audit evidence first;
stop on ambiguous creation to avoid duplicate roles.

All 30 new-role overwrite preimages are ABSENT (the role does not yet exist).
Current existing Premium and other role/member overwrites are unchanged.
Only the following 30 role-overwrite entries are proposed, keyed by the returned
NEW_ROLE_ID. For each use
`PUT /channels/{channel_id}/permissions/{NEW_ROLE_ID}` with `type:0` and the listed
string allow/deny. Do not replace any channel's whole permission_overwrites
array. All 30 children currently differ from their parent category; no category
mutation or permission sync is proposed. A category operation would be incorrect.

The 15 grants below reflected the original ordinary Premium operation packet, including
existing ordinary feeds named for external publishers. They are NOT approval for
new Partner paid destinations. Copy existing Premium allow/deny, additionally
allowing only its surviving guild-supplied channel bits (14,15,35,38); this keeps
the NEW guild role at zero. The original baseline-parity assertion was incorrect
on four rows: guild extras were added before accounting for @everyone channel
denies. The corrected masks above supersede those four values. Other-role and
member-specific combinations still require qualification.
It does not replicate guild-wide self-nickname or extra capabilities on unrelated
public channels. It preserves the current ordinary channel's read/write policy;
future Partner read-only/content rules are separate.

| Ordinary channel ID | Current name | New allow | New deny | Bot channel Manage Roles | Bits absent from bot guild/parent |
| --- | --- | --- | --- | --- | --- |
| `1433600779196825610` | 🚨-this-guy-swing-ideas | `66625` | `377957173248` | NO | `377957171200` |
| `1433833956972695693` | 🗨️-stock-chat | `117825` | `309237645312` | yes | `309237694464` |
| `1467667413171441757` | 📡-live-stock-scanner | `66625` | `377957173248` | NO | `377957171200` |
| `1494428986317471804` | 👀-premarket-main-watchlist | `309237761089` | `0` | yes | `309237694464` |
| `1495071872910364902` | 📰-news-scanner | `309237761025` | `0` | NO | `309237694464` |
| `1499558115383709726` | 🧾-chimie-futures-recaps | `309237761089` | `2048` | yes | `309237694464` |
| `1501999705469489202` | 🗞️-news-under-30m-mc | `66561` | `377957304384` | yes | `377957302272` |
| `1502124585435267093` | 💭-futures-chat | `309237763136` | `0` | yes | `309237694464` |
| `1506108307826409693` | ✍️-lessons-signup | `309237695553` | `0` | yes | `309237694464` |
| `1507426838153134200` | 📝-lesson-details | `66625` | `8515702525196288` | yes | `8515702525194240` |
| `1508201656670490634` | 🗞️-news-under-50m-mc | `66561` | `395137181760` | yes | `395137179648` |
| `1521917699108896990` | 🗞️-news-under-100m-mc | `66561` | `377957304320` | yes | `377957302272` |
| `1552662475235790908` | 💎-premium-features | `66560` | `7952753377081425` | NO | `7952753108643856` |
| `1552678787676774490` | ⛔-halt-alerts | `66625` | `377957173248` | NO | `377957171200` |
| `1554511894419607672` | 👀-post-overnight-watchlist | `309237761089` | `0` | yes | `309237694464` |

The following 15 publicly visible onboarding/upgrade placeholders are hidden for
the new role just as for existing Premium: new `allow:"0", deny:"1024"`.
No hidden channel is opened by these denials. For all 15 hides, allow/deny bits
are grantable from the bot guild/parent (missing mask zero), and the bot can view
the channel. Only welcome `1433849441437225050` retains effective bot Manage
Roles; the other 14 hide targets deny that capability. Do not execute a partial
welcome-only change.

| Channel ID | Current name |
| --- | --- |
| `1433849441437225050` | 👋-welcome-to-traderslink |
| `1552066404830806117` | 🔒stock-chat |
| `1552067427628482611` | 🔒futures-chat |
| `1552073395443859457` | 🔒this-guy-swing-ideas |
| `1552074462785048637` | 🔒live-stock-scanner |
| `1552074588924674162` | 🔒news-scanner |
| `1552074714732826725` | 🔒news-under-30m-mc |
| `1552074755396472933` | 🔒news-under-50m-mc |
| `1552074794793574460` | 🔒news-under-100m-mc |
| `1552075195156799570` | 🔒smokeys-lessons |
| `1552075531539710052` | 🔒lesson-details |
| `1552080131529384016` | 🔒premarket-main-watchlist |
| `1552733624242143312` | 🔒halt-alerts |
| `1553967093723172864` | 💎-premium-features |
| `1554549070620655699` | 🔒post-overnight-watchlist |

All remaining 39 guild channels stay untouched, including all categories;
`test community` category `1546033661604925471` and its coaching, alerts and
watchlist children `1546033844468187156`, `1546033958448529508`,
`1546034056725008385`; gated lesson text/voice; currently hidden options,
Crawlin's ideas, general watchlist, delayed scanners and reverse-splits.
The new zero-permission role has no allow overwrite there, so it introduces no
access. This snapshot alone does not prove the commercial classification of
all existing community roles. Any independently paid or ambiguous new destination
is excluded until explicitly classified; future Partner mappings must reject
both ordinary Premium roles as their dedicated entitlement role.

Minimum capabilities: role POST needs guild Manage Roles and a returned new
role below the actor's highest manageable role; no elevated permission is being
assigned. Each overwrite PUT needs effective Manage Roles on that target and
access to the target; Discord constrains every allowed/denied bit to the actor's
guild/parent permission set unless it has an explicit target Manage Roles
overwrite. The table's missing mask is `(proposed_allow | proposed_deny) &
~(bot_guild_permissions | bot_parent_permissions)`. None of these targets gives
the Platform bot that explicit exception. These exact masks include broad
existing deny flags; they are copied denials, not new elevated grants. A capable
operator must satisfy the API rule before each write; Administrator is not a
requested remedy. Recovery DELETEs need the same channel Manage Roles access;
role deletion requires manageable hierarchy and guild Manage Roles.

Failure/recovery: stop on drift, a failed/unknown write or capability error;
record which absent→new entries actually became present. Re-read before bounded
retry of an individual idempotent PUT. To abandon, DELETE only those confirmed
new entries, and DELETE the newly created role only after confirming no owner
assignment/external use began. Never rewrite prior overwrites or blindly retry
role POST. If safe recovery cannot be established, retain the exact partial
receipt and request Coordinator intervention; no false completion.

Before accepting execution, Coordinator must re-read the created role plus all
69 channels, confirm all 30 intended entries and no other overwrite/field
changes, verify no new visibility in the 39 untouched channels for the baseline,
and record returned role ID, HTTP results, exact before/after digests, scope and
remaining limitations. Respect existing member-specific denies and verify permission calculations for
hypothetical combinations holding both ordinary roles, without a census or
member assignment; the permission model merges other-role allows.
A failure stays partial/pending, never described as complete. If recovery is
necessary, remove only this operation's new overwrites/role after ensuring the
owner has not assigned members or attached external mappings. No census,
assignment or deletion of an assigned role is authorised by this proposal.

Owner then assigns intended recipients. Historical paid/manual/free assignments
still require reviewed classification before automated cleanup. Actual Whop
product-to-role mapping and cancellation/remove-all-role/kick settings must be
qualified before go-live; the new role is not automatically protected from an
external integration with broader removal privileges. Partner roles remain
TL-only grants based on paid TL Premium AND paid community coverage.

Official API/permission basis:
[Discord roles](https://docs.discord.com/developers/resources/guild#create-guild-role),
[channel overwrite API](https://docs.discord.com/developers/resources/channel#edit-channel-permissions),
and [permission hierarchy/sync](https://docs.discord.com/developers/topics/permissions).
No app source, database, provider configuration, Help UI, test/build or Git
mutation accompanies this receipt-only planning update. No live role setup
success or provider compatibility is claimed.

### Additional capability option — exact proposal, NOT authorised or executed

Coordinator confirms no independently verified already-authorised capable
alternative operator/credential is available in this lane. No other bot token,
user token, Whop credential or broad secret discovery is a substitute. An owner
or existing authorised server operator can instead use Discord's own role/channel
UI to perform the whole 1-role/30-overwrite setup above; no user token should be
supplied to Codex.

The narrow current-bot alternative requires SEPARATE owner approval for the
following temporary bot-member overwrite changes. They are outside the existing
new-role-only authorisation. No bot guild-role edit or hierarchy move is needed
for this setup; its already configured guild Manage Roles suffices for creating
a lower new role. Future maintenance of the existing paid role at position31
remains a separate hierarchy problem and is NOT solved by this option.

Discord documents an explicit target Manage Roles overwrite as the exception to
guild/parent bit-grantability constraints. Give that exception to the exact bot
MEMBER ID `1540380904705495090` (type1) on all 15 grant channels; additionally
allow View Channel where needed. For 14 hide targets the bot already sees the
channel, so only Manage Roles is added. Welcome needs no change. The minimal
actor-capability packet is 29 target entries: 28 previously absent entries plus
one existing halt-alerts member entry. Every existing other role/member entry
remains byte-for-byte intact.

| Target channel ID | Purpose | Before bot-member entry allow/deny | Proposed temporary allow/deny | Exact recovery |
| --- | --- | --- | --- | --- |
| `1433600779196825610` | grant | ABSENT | `268436480` / `0` | Delete only new bot-member entry |
| `1433833956972695693` | grant | ABSENT | `268436480` / `0` | Delete only new bot-member entry |
| `1467667413171441757` | grant | ABSENT | `268436480` / `0` | Delete only new bot-member entry |
| `1494428986317471804` | grant | ABSENT | `268436480` / `0` | Delete only new bot-member entry |
| `1495071872910364902` | grant | ABSENT | `268436480` / `0` | Delete only new bot-member entry |
| `1499558115383709726` | grant | ABSENT | `268436480` / `0` | Delete only new bot-member entry |
| `1501999705469489202` | grant | ABSENT | `268436480` / `0` | Delete only new bot-member entry |
| `1502124585435267093` | grant | ABSENT | `268436480` / `0` | Delete only new bot-member entry |
| `1506108307826409693` | grant | ABSENT | `268436480` / `0` | Delete only new bot-member entry |
| `1507426838153134200` | grant | ABSENT | `268436480` / `0` | Delete only new bot-member entry |
| `1508201656670490634` | grant | ABSENT | `268436480` / `0` | Delete only new bot-member entry |
| `1521917699108896990` | grant | ABSENT | `268436480` / `0` | Delete only new bot-member entry |
| `1552066404830806117` | hide | ABSENT | `268435456` / `0` | Delete only new bot-member entry |
| `1552067427628482611` | hide | ABSENT | `268435456` / `0` | Delete only new bot-member entry |
| `1552073395443859457` | hide | ABSENT | `268435456` / `0` | Delete only new bot-member entry |
| `1552074462785048637` | hide | ABSENT | `268435456` / `0` | Delete only new bot-member entry |
| `1552074588924674162` | hide | ABSENT | `268435456` / `0` | Delete only new bot-member entry |
| `1552074714732826725` | hide | ABSENT | `268435456` / `0` | Delete only new bot-member entry |
| `1552074755396472933` | hide | ABSENT | `268435456` / `0` | Delete only new bot-member entry |
| `1552074794793574460` | hide | ABSENT | `268435456` / `0` | Delete only new bot-member entry |
| `1552075195156799570` | hide | ABSENT | `268435456` / `0` | Delete only new bot-member entry |
| `1552075531539710052` | hide | ABSENT | `268435456` / `0` | Delete only new bot-member entry |
| `1552080131529384016` | hide | ABSENT | `268435456` / `0` | Delete only new bot-member entry |
| `1552662475235790908` | grant | ABSENT | `268436480` / `0` | Delete only new bot-member entry |
| `1552678787676774490` | grant | `134144` / `0` | `268569600` / `0` | Restore `134144` / `0` |
| `1552733624242143312` | hide | ABSENT | `268435456` / `0` | Delete only new bot-member entry |
| `1553967093723172864` | hide | ABSENT | `268435456` / `0` | Delete only new bot-member entry |
| `1554511894419607672` | grant | ABSENT | `268436480` / `0` | Delete only new bot-member entry |
| `1554549070620655699` | hide | ABSENT | `268435456` / `0` | Delete only new bot-member entry |

A capable owner/operator must bootstrap these temporary entries in Discord;
the restricted bot cannot use a denied permission to grant itself that
permission. Do not attempt a self-escalating API call. Do not use categories,
Administrator, guild-role changes or full overwrite-array replacement.
Temporary access lets this bot view 14 ordinary channels previously hidden from
it, and inherited ordinary channel capabilities may become usable while it can
view them. This is operational access exposure, not authorisation to read message
content, send messages, launch a worker or change member roles. No new membership
role is assigned to any person or bot in this procedure.

After separately approved bootstrap, Coordinator re-reads all29 actor entries and
checks effective View/Manage Roles, role hierarchy and the explicit overwrite
exception before the new-role POST/30role-overwrite PUTs. Runtime API behaviour
is unqualified until confirmed responses/readback; a failure triggers bounded
recovery, not bot escalation or blind repeated requests. Record exact preimages,
changed IDs and HTTP/readback results. No unexecuted proposal is a success receipt.

The bot can restore the halt entry (PUT134144/0) and delete the28new bot entries
using its temporary Manage Roles access on each respective target, performing
each target's restoration as the LAST write there. Do not remove the temporary
access before required role-overwrite recovery/readback on that target. If setup
fails, first remove only new-role entries while access remains, then restore all
actor preimages; delete the new role only if unassigned/unmapped. If cleanup
fails or drift occurred, leave an exact pending receipt for owner/operator
recovery and never claim capabilities were restored. Final readback must show
all29actor entries exactly back at baseline, including absent entries, alongside
the30intended new-role entries and unchanged existing roles/categories. Subsequent
new-role permission changes would again require a capable operator; this option
does not silently establish ongoing privileged bot administration.

## Mapping, offer and commercial lifecycle

Draft -> awaiting approval -> setup required -> active -> paused -> ended.
Rejected requests can be revised. Binding changes or changed channel membership
create a new version for approval. Renames do not replace immutable Discord IDs.
Approval alone does not activate delivery, charge money or create a role/channel.
Do not activate unless ownership, source access, target permissions, accepted
publishing agreement, payment evidence and offer configuration are verified.

Publishing pricing operates on contracted channels, not transient online counts;
included first channels and additional-channel quantity are explicit. Quotes use
exact minor units, supported currency precision and integer arithmetic with bounds.
Whop day intervals must be called day intervals: do not label 30 days as a calendar
month. A calendar-month quote requires separately qualified provider support.
Review prorating, reductions and renewal-effective changes before billing wiring.

## Incoming content and delivery

Use a persistent Discord Gateway receiver with approved guild/channel allowlists,
bounded payloads, heartbeat/resume/reconnect and durable gap tracking. No generic
unauthenticated message-ingestion endpoint. Only approved ordinary text messages
after activation; unsupported channel/message types are contained, never invented.
Allow source alert bots only by explicit author policy; exclude own mirror outputs
and loops. No history backfill on activation or automatic stale flood after outage.

Normalise for detection, not for rewriting the original alert. Recognise URLs,
bare domains, masked links, common invite obfuscation, server mentions, configured
aliases and mass mentions. Mixed media/text is held in full. Bound lengths and
matching work. No rendering of unsanitised HTML. Keep source channel references
private; delivery uses approved display names and suppressed allowed mentions.

Persist source message/revision/tombstone and per-mapping/per-part outbox before
I/O. Edits re-filter and update corresponding parts. Disallowed edits withdraw
old actionable content pending correction. Deletes remove all mirrored parts.
Never let an edit arriving after deletion resurrect a tombstone. Retry bounded
transient failures with Discord rate-limit delay. Uncertain sends require
reconciliation, not blind reposts. Preserve timestamp and order; delayed/missing
alerts are visible. Configure retention for held/raw text, deleted content and
minimal attempt/audit metadata. Durable workers retain one-writer deployment rules.

The authored Gateway is an explicitly started protocol driver with injected
socket, scheduler, exclusive receiver lease and durable session callbacks. It
opens nothing on import. It commits a resume cursor only after current-message
hydration and source/outbox persistence succeed. Session-storage failure stops
the receiver, rather than advancing past uncommitted posts. There is no actual
socket, HTTP implementation, source bot credential, runtime wiring or gap-recovery
scanner in this checkpoint.

The dormant ingress stores whole-message hold reasons and original timestamps;
editing a delayed first-arrival hold cannot turn it into an automatic stale
replay. Per-part delivery receipts retain destination IDs across edits and
withdrawals. An unconfirmed create/edit/delete is parked rather than blindly
reissued. A late confirmed response resolves newer correction/delete intents
without replaying an obsolete body. Multipart creates are ordered within the
message; rate-limit retries are bounded. Explicit recovery/attention UI, retention
execution and native Discord API qualification are still needed.

## User journeys and later UI

- Owner: partner requests -> inspect source/destination and offers -> set standard
  or private publishing terms -> approve -> qualify setup -> monitor, pause/end.
- Community: Publish to TradersLink -> verified source channels -> own Whop
  individual/package offers -> accepted publishing agreement -> redistribution
  consent -> owner approval -> held posts and delivery/billing health.
- Subscriber: Partner alert channels -> choose individual or same-community
  package -> verify Premium/Discord/Whop -> community-owned checkout -> verified
  subscription -> role assignment. Existing purchases can be verified without
  repurchase. Checkout redirect never grants access. Surface overlapping offers
  before another purchase. Manage subscriber billing in community Whop.

Later screens reuse dashboard-template shell/shared Light and Navy Dark tokens,
plain trader-facing copy, existing owner authorisation and mobile layouts. No
subtitle under page titles. Help Center changes are required with later visible
functionality (setup, filtering, payments/access, pauses and cancellations).
UI review occurs at the end per owner correction; this is not an early UI gate.

## Future integration descriptors (unassigned, no migration ID)

Proposed pages: `/partner-alerts`, `/communities/[communitySlug]/partner-alerts`,
`/admin/journal/partner-alerts`. Proposed API namespace `/api/partner-alerts` with
commands and Whop identity/event endpoints; private owner actions under
`/api/admin/journal/partner-alerts`. These are proposed names, not current routes.

ID-free storage: `partner_alert_partners`, `partner_alert_publishing_agreements`,
`partner_alert_mappings`, `partner_alert_offers`, `partner_alert_offer_channels`,
`partner_alert_whop_connections`, `partner_alert_whop_identities`,
`partner_alert_memberships`, `partner_alert_whop_inbox`,
`partner_alert_publishing_memberships`, `partner_alert_source_messages`,
`partner_alert_mirrored_parts`, `partner_alert_deliveries`, `partner_alert_role_jobs`,
`partner_alert_ingress_sessions`, `partner_alert_audit_events`.
Transaction support additionally needs `partner_alert_commands` and immutable
`partner_alert_agreement_acceptances`, with only the same ownership dependencies.
`partner_alert_source_revisions` preserves per-revision content and lets deliveries
reference the exact revision while the source header retains a deletion tombstone.
Later module integration must also cover account erasure/retention: these proposed
ownership FKs and append-only receipts must not be registered on a live runtime
without coordinated erasure closure and privacy review. Existing erasure code is
outside this slice and has not been edited.
The fifth-slice descriptor makes this gap explicit: current role jobs have a user
FK, so deleting them could also destroy outstanding external revocations. A
reviewed minimal cleanup ledger must survive local identity deletion, fence all
pending/in-flight workers and provider rehydration, and track external completion
separately. Journal-account-only erasure must preserve Platform subscriptions.
Full account erasure does not cancel separately paid community Whop billing.
Community-owner deletion needs an explicit stop/transfer disposition; historical
commercial signers/audit references require an explicit retention/anonymisation
policy before current FK closure can be registered. The pure descriptor always
returns `canExecute: false`; no physical purge, credential action, SQL or deletion
was executed. No retention period or legal basis is silently selected here.
External ownership FKs only Platform users and community identity, not Journal,
Shared or Coaching rows. Enforce composite community/offer/mapping ownership.
Migration ID/order/manifest and shared auth/navigation/runtime edits are unassigned.

## Slices and acceptance boundaries

1. Assigned now: standalone typed validation, content rules, access evaluator and
   pricing, plus these plan/progress records. No existing imports or runtime use.
2. Assigned after first checkpoint: isolated ID-free persistence/approvals,
   idempotent commands, append-only agreement acceptance, optimistic revisions and
   server-owned authority interfaces. No current runtime/auth adapter or schema
   registration; descriptor authored but never applied by this task.
3. Verified Whop identity/merchant/offer/membership reads and durable event inbox;
   separate publishing-fee evidence. Never import coaching money-moving behaviour.
4. Discord ingress, content revisions, bounded outbox and composite role worker;
   default off and unregistered until authorised integration.
5. Assigned after fourth checkpoint: dormant current-export authority/request
   bridge and explicit blocked erasure descriptor, with source path/hash provenance.
   No bound positive subscriber identity/Premium projection or erasure execution.
6. Own pure Discord-subject consistency candidate normaliser. Its observations
   remain unqualified, always `canAuthorise: false`; no new auth/Premium adapter.
7. Bounded Whop discovery, receipt hydration and minimal prepared evidence,
   always `canApply: false` until current-runtime provenance/generation/erasure
   and transactional application are qualified. No actual provider operation.
8. Pure publishing-payment observations bind the immutable accepted quote to the
   owner's Whop account and community payer; no synthetic subscriber offer,
   activation or payment authority. Unsupported native/commercial shapes require
   review. All output remains `canApply: false` pending runtime qualification.
9. Real owner/partner/subscriber forms, Help guides and final UI review.
10. Later explicitly authorised verification, isolated provider qualification,
   coordinator staging/release and owner activation. Source presence is not live
   acceptance. Tests/builds/previews/provider operations remain unrun now.

Future acceptance must cover cross-community isolation, same-community packages,
identity/provider environment binding, overlapping subscriptions, Premium expiry,
cancel-at-period-end vs immediate invalidation, provider outage/stale evidence,
disallowed edits/deletes, multipart content, duplicate and uncertain sends,
reconnect gaps, role hierarchy/revocation failure and provider pause boundaries.
The source-only checkpoint has run none of these checks. Nineteen conceptual
tables remain unregistered SQL strings, with no migration identity or execution.
Current auth/OAuth/API/page bindings, credential storage/rotation, concrete
read-only Whop transport and event hydration, publishing-payment activation,
Discord transport/resource verification, worker scheduling, attention/recovery,
erasure/retention and central Help/manifest integration remain separate work.

## Remaining product/activation decisions

Implementation has already started in isolated dormant source. These inputs can
stay configurable while coding continues; they are not all prerequisites to begin
coding. The affected behaviour must have explicit values before activation; proposed
starting points below are not owner approvals and none is silently selected by source.

| Decision | Choice still required | Proposed starting point for review |
| --- | --- | --- |
| Publishing terms | First/additional-channel prices, currency and recurring cadence | One published standard with private immutable exceptions |
| Contract changes | Proration, reductions and when revised terms take effect | Preview and accept changes; renewal-effective changes unless separately agreed |
| Historical ordinary access | Classify earlier manual/paid/free assignments before cleanup | Separate Premium Access role is created/corrected; preserve intentional gifts and review unknown assignments |
| Outages | Evidence freshness, reconciliation budgets and alert thresholds | No extra grace beyond verified paid coverage; uncertainty never proves nonpayment |
| Refund/dispute handling | Full/partial refund effects and dispute resolution | Explicit policy before activation; observed disputes withhold access |
| Source authors | Which source alert bots/webhooks can publish | Explicit allowlist; never accept all bot authors implicitly |
| Presentation/moderation | Approved neutral display aliases, reactions, held-post retention and reports | Read-only text; hold complete flagged messages for review |
| Delayed alerts | Whether reviewed replay is ever offered and maximum age | No automatic backfill or stale first-arrival replay |
| Erasure retention | Minimal audit/cleanup retention periods and qualified purge | Owner deletion pauses publishing/sales; owner-approved replacement required before resume |

No further choice is needed on the two billing relationships, standard public
publishing pricing with private exceptions, text-only/read-only/no-links launch,
no server promotion, paid-only Partner eligibility, same-community packages or
paid-history retention during publishing pause. The ordinary gift grantor-deletion
policy is resolved as stated above. Do not reopen these as outstanding questions.

Technical qualification is separate from these business decisions: select and
allocate actual current-baseline routes/read and mutation authority, same-connection
admitted storage/schema, native Whop permissions and paid-period proof, linked
identity/Premium authority, Discord intent approval/effective overwrites, complete
erasure/retention and recovery, then perform permitted end-to-end verification.
The old Whop normalizer cannot supply the required explicit paid-coverage proof;
a separately reviewed native successor is necessary before access can be enabled.
Privileged Discord administrators and
the server owner retain Discord-level powers; application roles cannot remove
those powers. Ordinary subscriber roles/Whop integrations must provide no bypass.
Owner UI review and release approval remain later gates.

Public reference checks: [Whop permissions](https://docs.whop.com/developer/guides/permissions),
[OAuth](https://docs.whop.com/developer/guides/oauth),
[memberships](https://docs.whop.com/developer/guides/memberships),
[signed webhooks/retries](https://docs.whop.com/developer/guides/webhooks),
[Discord permissions](https://docs.discord.com/developers/topics/permissions).
These support the proposed approach, not a claim of provider activation.
