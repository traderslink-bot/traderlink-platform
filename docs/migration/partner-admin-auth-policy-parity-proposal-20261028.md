# Partner admin Auth policy parity proposal — 2026-10-28

Status: immutable technical proposal only. No application source is changed or patched.
No executable verification, integration acceptance, Auth ownership or product approval
is implied. Coordinator must independently review this exact artifact before any apply.

## Exact allocation and source

Allocation: the opening “Next bounded Auth parity patch” in
`/home/traderlink/projects/traderslink-coordinator/shared-paid-source-ownership-20261028.md`.
Only this new proposal and the existing Partner plan/progress documents are written.
Writer21, content22 and all39 TS stay unchanged.

The unified patch below targets exactly ONE existing canonical file:
`src/modules/platform/server/administration/platform-admin-authorization.ts`.

- Read-only canonical base: `/home/traderlink/projects/traderlink-platform`.
- Base SHA-256: `88b9418612cb2ed52adc81d9966f30b94a5d4729114b96d2ce7a75796a2aad37`.
- Proposed postimage SHA-256: `383e73ab1cf60ec4539b32239db10cbe53e2d451e6040ea574b5023e3fe59340` (437 lines).
- Unified diff payload SHA-256: `b55eedab0a906cfc804c87563d2d29724146a5f62850f7949252b66917bf63e8` (401 lines, LF; includes its trailing newline).
- The preserved same-path file is DIFFERENT:
  `38c62ddef204b52d77da297b91460052e24788c4123f28874fbabbe57b10fa7a`.
  It is neither the patch base nor a replacement target.
- No standalone patch/postimage file, application copy, module, migration or runtime
  configuration is created. The exact diff payload lives only in this document.
  This document's hash is reported separately to avoid a circular checksum.

Referenced current dependencies are read-only:
`platform-admin-audit-repository.ts`
`55616bd0a52403a512d9ab9a1fc539d7122f031d521ad73329f9b3e3d2622a69`;
`platform-admin-request-security.ts`
`e9587d7ca280194286f84f7800e543cfd70e8ace38034e3d748cdac112fc8729`;
`platform-operator-repository.ts`
`97f64af92008d557dacdc10f924cb4944763b77de257efb54874fbb7566d82a4`.
No dependency source or shared pin is edited.

## Problem and bounded API

Writer21 repeats `requireOperator` for final validation. The actual current
`authorize` consumes the process-global access budget (120/minute) and appends
an allow event on every call. A successful private read therefore spends two units
and records two allow events. Its outer rollback also discards a genuine denial
audit, and discards a prior allow audit if later processing fails. A build cannot
establish policy parity for either behavior.

The proposal factors the actual policy ONCE inside its Auth-owned file and adds:

- `PlatformAdminAuthorization.withRequestAuditFrame(request, operation)`:
  a synchronous outer IMMEDIATE transaction on the existing caller-supplied
  connection, with private work inside a savepoint. It rejects an existing or
  foreign transaction and binds the live frame to that actual connection and
  original request headers/environment. No DB opener or new authority callback.
- The callback receives an unforgeable in-process `PlatformAdminRequestFrame`.
  Its `authorize(identity, headers)` runs the actual shared Auth policy and
  actual rate function once per logical access attempt. It privately captures the
  genuine allow/deny audit input produced by that policy and metadata factory.
- `frame.revalidate(originalScope, identity, headers)` accepts only the exact
  original scope object issued in that active frame. It reruns the SAME Auth
  policy and compares the original actual source binding. On continued validity
  it returns that same scope and original timestamps: no second budget charge,
  no duplicate allow event, no renewed grant.
- Final revalidation is automatic for every successful attempt before releasing
  private work. A real policy denial at revalidation records a genuine new denial
  with the existing reason/actor fields and original attempt correlation. It does
  not charge another rate unit. The earlier real allow is retained as history.
  A mere changed binding/invalid frame is an integration failure, not a fabricated
  policy-denial audit.
- A failure, including one the callback catches, poisons the frame. Protected work
  must be successfully rolled back to the savepoint before the outer transaction
  can append the privately captured genuine audits and commit its audit-only
  outcome. The original error is thrown after that commit. Failed private work
  is never committed as a way to save its audit.
- On success, protected work and the captured audit effects commit together.
  Audit append/outer commit failure returns no result and does not claim durability.
  Only detached plain synchronous DTOs can leave; handles, issued scopes,
  functions, promises/thenables, accessors and class objects cannot be serialized.
  All capability state is revoked in finally.

The frame captures only outcomes of its own actual Auth decisions; callers cannot
supply audit inputs or replay/import receipts. There is no audit-row scraping,
counter reset/refund, fake actor/reason/timestamp/correlation or permissive policy port.
The audit repository's existing append generates the event ID when persisting.

## Unchanged public-policy argument

The existing public `authorize(identity, headers)` remains immediate and throwing:
timestamp, correlation, audit-repository construction and one real rate charge
precede the same policy reads; the real audit is appended before returning scope
or throwing denial. Public constructor defaults and both public wrapper functions
are unchanged. Existing callers do not silently opt into staged audit behavior.

The extracted `readAdminPolicy` keeps the actual branch and query order:
development boundary first for development identities; otherwise current Discord
membership, actual active grant, configured-owner evidence and native guild-owner
evidence, then the same combined denial condition. It preserves all current
reason codes, roles, modes, permissions and Discord verification timestamp.
The configured-owner helper is byte-identical, including its existing query
semantics; this proposal does not introduce an unrelated policy/security change.

Audit payload factories are shared by the public and framed paths. Their actor,
action, outcome, reason, target, details, correlation and timestamp fields are the
current ones. `deny` still appends and throws the same error. There is no Partner
copy of the owner/grant predicates. Source comparison confirms the configured-owner
helper and both public wrapper functions remain byte-identical in the candidate.

Auth's original public method has no separate elapsed-time freshness policy.
The new frame does not create one or renew timestamps. Actual Partner session,
workspace, abort, actor-age and Discord-evidence-age checks must remain in the
qualified request adapter and run again at completion using the original scope.
This proposal does not replace those checks with a cached grant.

## Intended later integration — NOT part of this patch

Writer21 cannot simply call this API inside its existing IMMEDIATE transaction:
the frame correctly rejects that unrelated preexisting transaction. A separately
allocated writer successor must place its actual same-connection session/workspace
admission inside the Auth-owned outer frame, use `frame.authorize` for each real
operator access, and use only `frame.revalidate` for the original issued scope
at final Partner freshness validation. Its guarded private reads and original
session/identity/request checks must remain active until completion.

The callback must use the framed authorization path for these attempts. Calling
legacy `authorize` directly inside the savepoint still has legacy transactional
audit behavior and is not a supported substitute. No callback may manually end or
replace the native transaction or perform outside I/O through independently held
resources. The frame is not a sandbox for arbitrary server code already owning DB.
Neither DB access nor transaction control is exposed by the frame handle.

Actual session/identity admission, selected current baseline, schema/config receipts,
privacy/erasure, retention, provider/native authority and HTTP/runtime ownership
remain separate qualification gates. The frame is not Premium V2 admission, a
long-lived authorization/refresh ticket, generic erasure admission or a fake
configuration/schema receipt. Ordinary non-operator requests acquire no new
operator requirement merely by using an empty audit frame.

## Manual counterexamples and remaining qualification

These are source reasoning, not executed tests or a compile/apply result.

| Case | Proposed handling / review limit |
| --- | --- |
| One genuine allowed read plus final validation | One actual rate charge/allow input; final shared-policy read returns original scope without another allow event |
| Initial actual policy denial | One real rate charge and genuine denial input; private savepoint rolls back, audit-only outer outcome commits, then original denial is thrown |
| Callback throws after a real allow | Private work rolls back; real allow attempt is retained; rate unit is not refunded |
| New policy denial during final check | Same Auth-owned predicates produce genuine denial; prior allow plus new denial retained, no second rate charge |
| Grant/membership/config binding changes while still nominally allowed | Reject original qualification without inventing a policy-denial reason or replacing its scope |
| Rate-limit/configuration failure before a policy decision | Preserve actual error; do not fabricate a denial audit or refund a rate unit |
| Duplicate active grant / repository error | Preserve actual pre-decision failure; no synthetic allowed/denied receipt |
| Caller catches authorization failure | Sticky frame failure still rolls back protected work; audit effect cannot be silently swallowed |
| Foreign/copied scope, changed principal/headers, expired frame or other connection | Private map/object provenance rejects; no cached unqualified grant |
| Promise/thenable, getter/class object, handle or original scope in result | Reject without calling then/getters/toJSON; no async or serializable capability escape |
| Failed savepoint rollback/release | Abort outer transaction; never continue to audit-only commit of unproven rollback |
| Failed audit append or outer commit | Abort/throw; no returned private result or claim that the audit persisted |
| Process loss before the outer commit | In-process effects may be lost; this API does not invent crash-durable audit storage |
| Legacy standalone authorize and wrappers | Immediate current rate/audit/error semantics retained; no automatic frame interception |
| Independently captured DB/I/O used by trusted callback | Outside the scoped API contract; no promise to undo manually committed or external work |

Review must cover exact public-policy/error/audit parity; operator/freshness and
savepoint boundaries; genuine outcome provenance; audit-only commit after confirmed
rollback; and correct eventual writer integration. Later permitted executable
qualification is still necessary. No test, lint, typecheck, module import, SQL,
Git apply/check/mutation, provider, preview, runtime, migration or release was run.
Current canonical and preserved application source bytes are unchanged.

## Exact-base unified patch — unapplied

```diff
--- a/src/modules/platform/server/administration/platform-admin-authorization.ts
+++ b/src/modules/platform/server/administration/platform-admin-authorization.ts
@@ -58,14 +58,24 @@
   )?.matches === 1;
 }
 
-function deny(input: Readonly<{
-  audit: PlatformAdminAuditRepository;
+type AdminAccessAudit = Parameters<PlatformAdminAuditRepository["append"]>[0];
+type AllowedAdminPolicy = Readonly<{
+  kind: "allowed";
+  role: JournalAdminScope["role"];
+  mode: JournalAdminScope["mode"];
+  discordOwnerVerifiedAtUtc: string | null;
+  reasonCode: string;
+  binding: string;
+}>;
+type AdminPolicy = AllowedAdminPolicy | Readonly<{ kind: "denied"; reasonCode: string }>;
+
+function deniedAuditInput(input: Readonly<{
   identity: TraderLinkPlatformRequestIdentity;
   correlationRefSha256: string;
   nowUtc: string;
   reasonCode: string;
-}>): never {
-  input.audit.append({
+}>): AdminAccessAudit {
+  return {
     actorKind: "platform_user",
     actorUserId: input.identity.scope.userId,
     actorRole: "authenticated_user",
@@ -78,8 +88,146 @@
     previewReceiptSha256: null,
     details: Object.freeze({ boundary: "journal_administration" }),
     createdAtUtc: input.nowUtc,
+  };
+}
+
+function deny(input: Readonly<{
+  audit: PlatformAdminAuditRepository;
+  identity: TraderLinkPlatformRequestIdentity;
+  correlationRefSha256: string;
+  nowUtc: string;
+  reasonCode: string;
+}>): never {
+  input.audit.append(deniedAuditInput(input));
+  platformFailure("TRADERLINK_JOURNAL_ADMIN_ACCESS_DENIED");
+}
+
+function allowedAuditInput(input: Readonly<{
+  identity: TraderLinkPlatformRequestIdentity;
+  policy: AllowedAdminPolicy;
+  correlationRefSha256: string;
+  nowUtc: string;
+}>): AdminAccessAudit {
+  return {
+    actorKind: "platform_user",
+    actorUserId: input.identity.scope.userId,
+    actorRole: input.policy.role,
+    action: "admin_access_allowed",
+    targetKind: "authority",
+    targetRefSha256: digest("journal_administration"),
+    outcome: "success",
+    reasonCode: input.policy.reasonCode,
+    correlationRefSha256: input.correlationRefSha256,
+    previewReceiptSha256: null,
+    details: Object.freeze({ mode: input.policy.mode }),
+    createdAtUtc: input.nowUtc,
+  };
+}
+
+function scopeForPolicy(identity: TraderLinkPlatformRequestIdentity,
+  policy: AllowedAdminPolicy, nowUtc: string): JournalAdminScope {
+  return Object.freeze({
+    userId: identity.scope.userId,
+    role: policy.role,
+    mode: policy.mode,
+    authorizedAtUtc: nowUtc,
+    discordOwnerVerifiedAtUtc: policy.discordOwnerVerifiedAtUtc,
+    permissions: JOURNAL_ADMIN_PERMISSIONS,
   });
+}
+
+/** One implementation of the EXISTING policy. No rate/audit effect here.
+ * Keep query/branch order and the configured-owner helper unchanged. */
+function readAdminPolicy(database: Database.Database, environment: NodeJS.ProcessEnv,
+  identity: TraderLinkPlatformRequestIdentity, requestHeaders: Headers): AdminPolicy {
+  if (identity.mode === "local_development") {
+    if (!validateDevelopmentDashboardRequest(requestHeaders, environment).ok) {
+      return { kind: "denied", reasonCode: "development_boundary_invalid" };
+    }
+    return { kind: "allowed", role: "development_journal_owner_admin", mode: "local_development_owner",
+      discordOwnerVerifiedAtUtc: null, reasonCode: "development_loopback_authorized", binding: "local_development" };
+  }
+  const membership = new PlatformDiscordMembershipRepository(database).findCurrent(
+    identity.scope.userId, resolveTraderLinkDiscordGuildId(environment));
+  const activeGrant = new PlatformOperatorRepository(database).findActive();
+  const ownerDiscordSubject = readProtectedInitialOwnerDiscordSubject(environment);
+  const configuredOwnerMatched = hasConfiguredDiscordOwnerIdentity({ database,
+    userId: identity.scope.userId, ownerDiscordSubject });
+  const discordServerOwnerMatched = identity.discord?.guildOwner === true && membership?.guildOwner === true;
+  if (!membership || !activeGrant || activeGrant.userId !== identity.scope.userId
+    || (!configuredOwnerMatched && !discordServerOwnerMatched)) {
+    return { kind: "denied", reasonCode: !activeGrant ? "active_operator_grant_missing" : "owner_admin_authorization_failed" };
+  }
+  return { kind: "allowed", role: "journal_owner_admin", mode: "production_discord_owner",
+    discordOwnerVerifiedAtUtc: membership.lastVerifiedAtUtc, reasonCode: "discord_owner_and_grant_confirmed",
+    binding: JSON.stringify([membership, activeGrant, ownerDiscordSubject ?? null,
+      configuredOwnerMatched, discordServerOwnerMatched]) };
+}
+
+export type PlatformAdminRequestFrame = Readonly<{
+  /** One real rate charge and actual policy decision per logical access attempt. */
+  authorize: PlatformAdminAuthorization["authorize"];
+  /** Only an original scope issued in THIS active frame is accepted. No renewal. */
+  revalidate: (scope: JournalAdminScope, identity: TraderLinkPlatformRequestIdentity,
+    requestHeaders: Headers) => JournalAdminScope;
+}>;
+
+type RequestFrameState = { active: boolean; failed: boolean; error: unknown };
+const activeAuditFrames = new WeakMap<Database.Database, RequestFrameState>();
+const frameCapabilities = new WeakSet<object>();
+
+function frameFailure(): never {
   platformFailure("TRADERLINK_JOURNAL_ADMIN_ACCESS_DENIED");
+}
+function headersBinding(headers: Headers): string {
+  const entries: [string, string][] = [];
+  headers.forEach((value, name) => entries.push([name, value]));
+  return JSON.stringify(entries);
+}
+function environmentBinding(environment: NodeJS.ProcessEnv): string {
+  return JSON.stringify(Object.keys(environment).sort().map(key => [key, environment[key]]));
+}
+function snapshotIdentity(identity: TraderLinkPlatformRequestIdentity): TraderLinkPlatformRequestIdentity {
+  return Object.freeze({ mode: identity.mode, sessionId: identity.sessionId,
+    scope: Object.freeze({ ...identity.scope, allowedAccountIds: Object.freeze([...identity.scope.allowedAccountIds]) }),
+    displayName: identity.displayName,
+    discord: identity.discord ? Object.freeze({ guildOwner: identity.discord.guildOwner,
+      roleIds: Object.freeze([...identity.discord.roleIds]) }) : null });
+}
+/** Plain DTOs only. No then/getter/toJSON invocation or capability serialization. */
+function detachFrameResult<T>(value: T): T {
+  const ancestors = new WeakSet<object>(); let nodes = 0;
+  const copy = (item: unknown, depth: number): unknown => {
+    if (++nodes > 100_000 || depth > 32) return frameFailure();
+    if (item === null || item === undefined || typeof item === "string" || typeof item === "boolean") return item;
+    if (typeof item === "number") return Number.isFinite(item) ? item : frameFailure();
+    if (typeof item !== "object" || frameCapabilities.has(item) || ancestors.has(item)) return frameFailure();
+    const array = Array.isArray(item); const prototype = Object.getPrototypeOf(item);
+    if ((!array && prototype !== Object.prototype && prototype !== null)
+      || (array && prototype !== Array.prototype) || "then" in item) return frameFailure();
+    const descriptors = Object.getOwnPropertyDescriptors(item);
+    if (Reflect.ownKeys(descriptors).some(key => typeof key !== "string")) return frameFailure();
+    ancestors.add(item);
+    try {
+      if (array) {
+        if (item.length > 100_000 || Object.keys(descriptors).length !== item.length + 1) return frameFailure();
+        const output: unknown[] = [];
+        for (let index = 0; index < item.length; index += 1) {
+          const descriptor = descriptors[String(index)];
+          if (!descriptor?.enumerable || !("value" in descriptor)) return frameFailure();
+          output.push(copy(descriptor.value, depth + 1));
+        }
+        return Object.freeze(output);
+      }
+      const output: Record<string, unknown> = Object.create(null);
+      for (const [key, descriptor] of Object.entries(descriptors)) {
+        if (!descriptor.enumerable || !("value" in descriptor)) return frameFailure();
+        Object.defineProperty(output, key, { value: copy(descriptor.value, depth + 1), enumerable: true });
+      }
+      return Object.freeze(output);
+    } finally { ancestors.delete(item); }
+  };
+  return copy(value, 0) as T;
 }
 
 export class PlatformAdminAuthorization {
@@ -104,98 +252,133 @@
       now: this.now,
       userId: identity.scope.userId,
     });
-
-    if (identity.mode === "local_development") {
-      if (!validateDevelopmentDashboardRequest(
-        requestHeaders,
-        this.environment,
-      ).ok) {
-        deny({
-          audit,
-          identity,
-          correlationRefSha256,
-          nowUtc,
-          reasonCode: "development_boundary_invalid",
+    const policy = readAdminPolicy(this.database, this.environment, identity, requestHeaders);
+    if (policy.kind === "denied") {
+      deny({ audit, identity, correlationRefSha256, nowUtc, reasonCode: policy.reasonCode });
+    }
+    audit.append(allowedAuditInput({ identity, policy, correlationRefSha256, nowUtc }));
+    return scopeForPolicy(identity, policy, nowUtc);
+  }
+
+  /** Additive, synchronous outer frame on the SAME caller-owned connection.
+   * Reject existing transactions. Protected work is isolated in a savepoint;
+   * only real Auth decision audits survive its rollback. This is NOT session/
+   * erasure/schema admission. The caller must supply its actual request checks.
+   * No network I/O or manual transaction control is permitted in the callback. */
+  withRequestAuditFrame<T>(request: Request, operation: (frame: PlatformAdminRequestFrame) => T): T {
+    const database = this.database;
+    if (!database.open || database.readonly || database.inTransaction || activeAuditFrames.has(database)
+      || request.signal.aborted || typeof operation !== "function") return frameFailure();
+    const originalHeaders = new Headers(request.headers);
+    const requestBinding = headersBinding(originalHeaders);
+    const originalEnvironment = environmentBinding(this.environment);
+    type Attempt = { identity: TraderLinkPlatformRequestIdentity; identityBinding: string; policy: AllowedAdminPolicy;
+      scope: JournalAdminScope; correlationRefSha256: string };
+    type Outcome = { kind: "success"; value: T } | { kind: "failure"; error: unknown };
+    const execute = database.transaction((): Outcome => {
+      const state: RequestFrameState = { active: true, failed: false, error: undefined };
+      const attempts = new Map<JournalAdminScope, Attempt>();
+      const audits: AdminAccessAudit[] = [];
+      let principalBinding: string | null = null;
+      const assertActive = (): void => {
+        if (!state.active || activeAuditFrames.get(database) !== state
+          || !database.open || !database.inTransaction || request.signal.aborted
+          || headersBinding(request.headers) !== requestBinding
+          || environmentBinding(this.environment) !== originalEnvironment) return frameFailure();
+        if (state.failed) throw state.error;
+      };
+      const guarded = <R>(action: () => R): R => {
+        try { assertActive(); const result = action(); assertActive(); return result; }
+        catch (error) {
+          if (!state.failed) { state.failed = true; state.error = error; }
+          throw error;
+        }
+      };
+      const requireInput = (identity: TraderLinkPlatformRequestIdentity, headers: Headers) => {
+        if (headersBinding(headers) !== requestBinding) return frameFailure();
+        const snapshot = snapshotIdentity(identity); const binding = JSON.stringify(snapshot);
+        if (principalBinding !== null && principalBinding !== binding) return frameFailure();
+        principalBinding = binding;
+        return { snapshot, binding };
+      };
+      activeAuditFrames.set(database, state);
+      let outcome: Outcome;
+      let workStarted = false;
+      try {
+        database.exec("SAVEPOINT platform_admin_request_work");
+        workStarted = true;
+        const revalidate = (scope: JournalAdminScope, identity: TraderLinkPlatformRequestIdentity,
+          headers: Headers): JournalAdminScope => guarded(() => {
+          const attempt = attempts.get(scope);
+          const input = requireInput(identity, headers);
+          if (!attempt || attempt.identityBinding !== input.binding) return frameFailure();
+          const policy = readAdminPolicy(database, this.environment, input.snapshot, originalHeaders);
+          if (policy.kind === "denied") {
+            audits.push(deniedAuditInput({ identity: input.snapshot, reasonCode: policy.reasonCode,
+              nowUtc: createCanonicalUtcTimestamp(this.now()), correlationRefSha256: attempt.correlationRefSha256 }));
+            platformFailure("TRADERLINK_JOURNAL_ADMIN_ACCESS_DENIED");
+          }
+          if (policy.binding !== attempt.policy.binding || policy.role !== attempt.policy.role
+            || policy.mode !== attempt.policy.mode) return frameFailure();
+          // Same genuine original scope/time: no rate charge, allow event or renewal.
+          return attempt.scope;
         });
+        const frame: PlatformAdminRequestFrame = Object.freeze({
+          authorize: (identity: TraderLinkPlatformRequestIdentity, headers: Headers): JournalAdminScope => guarded(() => {
+            const input = requireInput(identity, headers);
+            const nowUtc = createCanonicalUtcTimestamp(this.now());
+            const correlationRefSha256 = requestCorrelationDigest(originalHeaders);
+            consumeJournalAdminRateLimit({ category: "access", environment: this.environment,
+              headers: originalHeaders, now: this.now, userId: input.snapshot.scope.userId });
+            const policy = readAdminPolicy(database, this.environment, input.snapshot, originalHeaders);
+            if (policy.kind === "denied") {
+              audits.push(deniedAuditInput({ identity: input.snapshot, reasonCode: policy.reasonCode,
+                nowUtc, correlationRefSha256 }));
+              platformFailure("TRADERLINK_JOURNAL_ADMIN_ACCESS_DENIED");
+            }
+            const scope = scopeForPolicy(input.snapshot, policy, nowUtc);
+            attempts.set(scope, { identity: input.snapshot, identityBinding: input.binding,
+              policy, scope, correlationRefSha256 });
+            frameCapabilities.add(scope);
+            audits.push(allowedAuditInput({ identity: input.snapshot, policy, nowUtc, correlationRefSha256 }));
+            return scope;
+          }),
+          revalidate,
+        });
+        frameCapabilities.add(frame);
+        const value = detachFrameResult(operation(frame));
+        assertActive();
+        for (const attempt of attempts.values()) {
+          revalidate(attempt.scope, attempt.identity, originalHeaders);
+        }
+        assertActive();
+        database.exec("RELEASE SAVEPOINT platform_admin_request_work");
+        workStarted = false;
+        outcome = { kind: "success", value };
+      } catch (error) {
+        // This must succeed before any audit-only commit is possible.
+        if (workStarted) {
+          database.exec("ROLLBACK TO SAVEPOINT platform_admin_request_work");
+          database.exec("RELEASE SAVEPOINT platform_admin_request_work");
+          workStarted = false;
+        } else {
+          throw error;
+        }
+        outcome = { kind: "failure", error: state.failed ? state.error : error };
+      } finally {
+        state.active = false;
+        attempts.clear();
+        if (activeAuditFrames.get(database) === state) activeAuditFrames.delete(database);
       }
-      audit.append({
-        actorKind: "platform_user",
-        actorUserId: identity.scope.userId,
-        actorRole: "development_journal_owner_admin",
-        action: "admin_access_allowed",
-        targetKind: "authority",
-        targetRefSha256: digest("journal_administration"),
-        outcome: "success",
-        reasonCode: "development_loopback_authorized",
-        correlationRefSha256,
-        previewReceiptSha256: null,
-        details: Object.freeze({ mode: "local_development_owner" }),
-        createdAtUtc: nowUtc,
-      });
-      return Object.freeze({
-        userId: identity.scope.userId,
-        role: "development_journal_owner_admin",
-        mode: "local_development_owner",
-        authorizedAtUtc: nowUtc,
-        discordOwnerVerifiedAtUtc: null,
-        permissions: JOURNAL_ADMIN_PERMISSIONS,
-      });
-    }
-
-    const membership = new PlatformDiscordMembershipRepository(this.database)
-      .findCurrent(
-        identity.scope.userId,
-        resolveTraderLinkDiscordGuildId(this.environment),
-      );
-    const activeGrant = new PlatformOperatorRepository(this.database).findActive();
-    const configuredOwnerMatched = hasConfiguredDiscordOwnerIdentity({
-      database: this.database,
-      userId: identity.scope.userId,
-      ownerDiscordSubject: readProtectedInitialOwnerDiscordSubject(
-        this.environment,
-      ),
+      // No caller callback or replay API can add/replace these private effects.
+      // A failure here aborts the outer transaction, including successful work.
+      const audit = new PlatformAdminAuditRepository(database);
+      for (const input of audits) audit.append(input);
+      return outcome;
     });
-    const discordServerOwnerMatched =
-      identity.discord?.guildOwner === true && membership?.guildOwner === true;
-    if (
-      !membership ||
-      !activeGrant ||
-      activeGrant.userId !== identity.scope.userId ||
-      (!configuredOwnerMatched && !discordServerOwnerMatched)
-    ) {
-      deny({
-        audit,
-        identity,
-        correlationRefSha256,
-        nowUtc,
-        reasonCode: !activeGrant
-          ? "active_operator_grant_missing"
-          : "owner_admin_authorization_failed",
-      });
-    }
-
-    audit.append({
-      actorKind: "platform_user",
-      actorUserId: identity.scope.userId,
-      actorRole: "journal_owner_admin",
-      action: "admin_access_allowed",
-      targetKind: "authority",
-      targetRefSha256: digest("journal_administration"),
-      outcome: "success",
-      reasonCode: "discord_owner_and_grant_confirmed",
-      correlationRefSha256,
-      previewReceiptSha256: null,
-      details: Object.freeze({ mode: "production_discord_owner" }),
-      createdAtUtc: nowUtc,
-    });
-    return Object.freeze({
-      userId: identity.scope.userId,
-      role: "journal_owner_admin",
-      mode: "production_discord_owner",
-      authorizedAtUtc: nowUtc,
-      discordOwnerVerifiedAtUtc: membership.lastVerifiedAtUtc,
-      permissions: JOURNAL_ADMIN_PERMISSIONS,
-    });
+    const outcome = execute.immediate();
+    if (outcome.kind === "failure") throw outcome.error;
+    return outcome.value;
   }
 }
 
```
