import "server-only";
import { randomUUID } from "node:crypto";
import { PartnerAlertAdmission, requirePartnerAlertAdmission } from "./partner-alert-admission";
import { PartnerAlertDiscordGateway, type PartnerAlertGatewaySocket } from "./partner-alert-discord-gateway";
import { PartnerAlertGatewaySessionStore } from "./partner-alert-gateway-session-store";
import { readPartnerAlertDiscordJson } from "./partner-alert-discord-channel-catalog";
import { createPartnerAlertReviewDiscordRoleObserver } from "./partner-alert-review-discord";
import { createPartnerAlertPremiumWhopAccessProvider } from "./partner-alert-premium-whop-access-provider";
import { createPartnerAlertPremiumWhopSubscriberBinding } from "./partner-alert-premium-whop-refresh";
import { bindPartnerAlertNativeSubscriber } from "./partner-alert-native-runtime";
import { createPartnerAlertStripeRolePorts } from "./partner-alert-stripe-role-ports";
import { reconcilePartnerAlertStripeRole, type PartnerAlertStripeRoleIntent } from "./partner-alert-stripe-role-reconciliation";
import { PARTNER_ALERT_WHOP_API_VERSION } from "./partner-alert-whop-client";
import { startPartnerAlertMirroring } from "./partner-alert-mirroring";
import { assertHostedQaExecution, closeHostedQaAuthority, hostedQaDeadline, hostedQaManifest,
  hostedQaPremiumReadToken, hostedQaRuntime, readHostedQaOperation, recordHostedQaOperation,
  reserveHostedQaBudget, withPartnerAlertHostedQaParent, type HostedPaidQaAuthority } from "./partner-alert-hosted-qa-authority";
import { createPartnerAlertHostedQaDiscordTransport, createPartnerAlertHostedQaWhopTransport } from "./partner-alert-hosted-qa-transports";

function nativeSocket(url: string): PartnerAlertGatewaySocket {
  const socket = new WebSocket(url);
  return { onMessage: fn => socket.addEventListener("message", e => fn(typeof e.data === "string" ? e.data : "")),
    onClose: fn => socket.addEventListener("close", e => fn(e.code)), onError: fn => socket.addEventListener("error", fn),
    send: text => socket.send(text), close: (code, reason) => socket.close(code, reason) };
}
/** Explicit private controller only. Construction starts no receiver/timer or
 * global worker and never creates a payment, approval, policy or entitlement. */
export function createPartnerAlertHostedQaController(cap: HostedPaidQaAuthority,
  ports: Readonly<{ fetch?: typeof fetch; socketFactory?: (url: string) => PartnerAlertGatewaySocket }> = {}) {
  const runtime = hostedQaRuntime(cap), manifest = hostedQaManifest(cap), db = runtime.database, core = runtime.core;
  let admitted: PartnerAlertAdmission;
  try { admitted = requirePartnerAlertAdmission(db); } catch { admitted = PartnerAlertAdmission.bind(db); }
  const abort = new AbortController(), pending = new Set<Promise<unknown>>(), stops = new Set<() => Promise<void>>();
  let closing: Promise<void> | null = null, started = false;
  const fail = (): never => { throw new Error("paid_hosted_qa_controller_refused"); };
  const current = () => { if (closing || abort.signal.aborted) fail(); assertHostedQaExecution(cap); };
  const originalFetch = ports.fetch ?? fetch;
  const transport: typeof fetch = (url, init) => {
    const signal = AbortSignal.any([abort.signal, ...(init?.signal ? [init.signal] : [])]);
    if (signal.aborted) return Promise.reject(new Error("Paid QA stopped."));
    return originalFetch(url, { ...init, signal });
  };
  const discord = createPartnerAlertHostedQaDiscordTransport(cap, transport);
  const output = () => { current(); return runtime.trusted.readCurrentConfiguration(); };
  const attention: string[] = [];
  const report = (reason: string) => { if (attention.length < 32 && /^[A-Za-z0-9_:-]{1,160}$/u.test(reason)) attention.push(reason); };
  const stop = (): Promise<void> => closing ??= Promise.resolve().then(async () => {
    abort.abort();
    await Promise.allSettled([...stops].map(fn => fn()));
    await Promise.allSettled([...pending]);
    closeHostedQaAuthority(cap);
  });
  function tracked<T>(operation: () => Promise<T>): Promise<T> {
    current(); const work = operation(); pending.add(work); void work.finally(() => pending.delete(work)).catch(() => {}); return work;
  }
  const socketFactory = (url: string): PartnerAlertGatewaySocket => {
    current(); const original = (ports.socketFactory ?? nativeSocket)(url);
    return { onClose: fn => original.onClose(fn), onError: fn => original.onError(fn),
      send: text => original.send(text), close: (code, reason) => original.close(code, reason),
      onMessage: fn => original.onMessage(text => {
      try {
        current(); reserveHostedQaBudget(cap, "gatewayPackets"); reserveHostedQaBudget(cap, "gatewayBytes", Buffer.byteLength(text)); fn(text);
      } catch { void stop(); }
    }) };
  };
  async function memberRoles(): Promise<string[]> {
    const configured = output(); if (!configured) return fail();
    const response = await discord(`https://discord.com/api/v10/guilds/${manifest.guildId}/members/${manifest.buyerDiscordUserId}`, {
      method: "GET", headers: { authorization: `Bot ${configured.discordBotToken}` } });
    if (response.status !== 200) return fail();
    const value = await readPartnerAlertDiscordJson(response, abort.signal) as Record<string, unknown>;
    if (!Array.isArray(value.roles) || value.roles.some(id => typeof id !== "string")) return fail();
    return [...value.roles as string[]].sort();
  }
  function assertProtectedBaseline(roles: readonly string[]) {
    const managed = new Set(manifest.bindings.map(b => b.roleId));
    if (roles.some(id => !managed.has(id) && !manifest.protectedRoleIds.includes(id))) fail();
  }
  return Object.freeze({
    /** READY proves a real bot session; RESUMED is labeled separately and does
     * not pretend to prove a newly negotiated intent set. No ingress is bound. */
    gatewayReady: () => tracked(async () => {
      if (manifest.mode !== "gateway_ready" || started) return fail(); started = true;
      const configured = output(); if (!configured) return fail();
      const store = new PartnerAlertGatewaySessionStore(db, { botUserId: manifest.botUserId, destinationGuildId: manifest.guildId,
        leaseToken: randomUUID(), nowUtc: () => new Date().toISOString() });
      let ready = false, stopped: Promise<void> | null = null, connections = 0, resumed = false;
      let resolve!: (result: Readonly<{ ready: boolean; session: "identified" | "resumed"; attention: readonly string[] }>) => void;
      const done = new Promise<Readonly<{ ready: boolean; session: "identified" | "resumed"; attention: readonly string[] }>>(r => { resolve = r; });
      const owned: { driver: PartnerAlertDiscordGateway | null; acquisitionAttempted: boolean;
        timer: ReturnType<typeof setTimeout> | undefined; renew: ReturnType<typeof setInterval> | undefined } =
        { driver: null, acquisitionAttempted: false, timer: undefined, renew: undefined };
      const finish = (): Promise<void> => stopped ??= Promise.resolve().then(async () => {
        clearTimeout(owned.timer); clearInterval(owned.renew);
        let clean = true;
        try { owned.driver?.stop(); } catch { clean = false; report("receiver_stop_unavailable"); }
        try { await owned.driver?.drain(); } catch { clean = false; report("receiver_drain_unavailable"); }
        if (owned.acquisitionAttempted) {
          // Original exact-token cleanup only. A changed release cannot admit a
          // new write; preserve the lease/obligation and still settle the caller.
          try { runtime.trusted.assertCurrentRelease(); store.release(); }
          catch { clean = false; report("receiver_lease_release_unavailable"); }
        }
        stops.delete(finish);
        resolve({ ready: ready && clean, session: resumed ? "resumed" : "identified", attention: [...attention] });
      });
      stops.add(finish);
      try {
        const acquired = withPartnerAlertHostedQaParent(cap, () => {
          owned.acquisitionAttempted = true; return store.acquire();
        });
        if (!acquired) return fail();
        resumed = Boolean(withPartnerAlertHostedQaParent(cap, () => store.loadSession()));
        const driver = new PartnerAlertDiscordGateway({ enabled: true, botToken: configured.discordBotToken,
          expectedBotUserId: manifest.botUserId, socketFactory: url => { if (++connections > 3) return fail(); return socketFactory(url); },
          hasExclusiveReceiverLease: () => { try { current(); return store.isCurrent(); } catch { return false; } },
          identifyAllowed: async () => {
            current(); if (!withPartnerAlertHostedQaParent(cap, () => store.reserveIdentify())) return false;
            const response = await discord("https://discord.com/api/v10/gateway/bot", { method: "GET", headers: { authorization: `Bot ${configured.discordBotToken}` } });
            if (response.status !== 200) return false;
            const value = await readPartnerAlertDiscordJson(response, abort.signal) as { shards?: number; session_start_limit?: { remaining?: number; max_concurrency?: number } };
            return value.shards === 1 && Number(value.session_start_limit?.remaining) > 0 && Number(value.session_start_limit?.max_concurrency) > 0;
          },
          shouldReceive: () => false, onDispatch: async () => { throw new Error("Readiness may not dispatch messages."); },
          loadSession: () => withPartnerAlertHostedQaParent(cap, () => store.loadSession()),
          saveSession: value => {
            withPartnerAlertHostedQaParent(cap, () => store.saveSession(value)); ready = true;
            queueMicrotask(() => { void finish(); });
          },
          clearSession: () => withPartnerAlertHostedQaParent(cap, () => store.clearSession()),
          markGap: () => withPartnerAlertHostedQaParent(cap, () => store.markGap()), attention: report,
          schedule: (fn, ms) => setTimeout(fn, ms), cancel: handle => clearTimeout(handle as ReturnType<typeof setTimeout>), random: Math.random,
        });
        owned.driver = driver;
        owned.renew = setInterval(() => {
          try { if (withPartnerAlertHostedQaParent(cap, () => store.renew())) return; } catch { /* Parent or exact lease ended. */ }
          report("receiver_lease_unavailable"); void finish();
        }, 10_000);
        owned.timer = setTimeout(() => { void finish(); }, Math.max(1, Math.min(60_000, hostedQaDeadline(cap) - Date.now())));
        if (!driver.start()) await finish();
        return done;
      } catch (error) { await finish(); throw error; }
    }),
    reconcileRole: (operationId: string) => tracked(async () => {
      if (manifest.mode !== "roles" || !/^[0-9a-f-]{36}$/u.test(operationId)) return fail();
      const row = db.prepare(`SELECT r.operation_id,r.community_id,r.buyer_user_id,r.mapping_id,r.desired_present,r.status,c.offer_id,c.offer_version
        FROM partner_alert_stripe_role_reconciliations r JOIN partner_alert_stripe_checkout_claims c ON c.claim_id=r.claim_id
        WHERE r.operation_id=? AND r.environment='sandbox' AND c.environment='sandbox'`).get(operationId) as
        { operation_id: string; community_id: string; buyer_user_id: string; mapping_id: string; desired_present: 0 | 1; status: string; offer_id: string; offer_version: number } | undefined;
      if (!row || row.community_id !== manifest.communityId || row.buyer_user_id !== manifest.buyerUserId
        || !manifest.bindings.some(b => b.mappingId === row.mapping_id)) return fail();
      const old = readHostedQaOperation(cap, operationId);
      if (old === "applied" && row.status === "applied") return { status: "applied" as const, replay: true };
      if (!["pending", "held", "failed"].includes(row.status)) return fail();
      const baseline = await memberRoles(); assertProtectedBaseline(baseline);
      const clears: (() => void)[] = [];
      try {
        const outputConfig = output(); if (!outputConfig) return fail();
        const paidRoleId = process.env.TRADERLINK_DISCORD_PREMIUM_MEMBER_ROLE_ID;
        if (!paidRoleId || !manifest.protectedRoleIds.includes(paidRoleId)) return fail();
        const bind = createPartnerAlertStripeRolePorts(db, { readOutput: output, nowUtc: () => new Date().toISOString(),
          protectedRoleIds: manifest.protectedRoleIds, reportFailure: () => report("role_pending"), discordFetch: discord,
          bindCurrentAuthority: target => {
            current(); if (target.userId !== manifest.buyerUserId || target.communityId !== manifest.communityId
              || target.mappingIds.some(id => !manifest.bindings.some(b => b.mappingId === id))) return null;
            const producer = core.memberRepository(target.userId);
            const writer = { run: <T>(fn: () => T) => admitted.runCommunity(target.communityId, [target.userId], fn), isCurrentWriter: () => core.isCurrentWriter() };
            const initial = writer.run(() => {
              const link = producer.resolveUserAuthority(target.userId, manifest.guildId); if (link.kind !== "linked") return null;
              const snapshot = producer.captureV2(link.authorityKey); if (snapshot.kind !== "snapshot" || snapshot.ticket.scope.discordUserId !== manifest.buyerDiscordUserId
                || snapshot.policy.state !== "active" || snapshot.policy.offerScopes.length !== 1 || !snapshot.policy.nativeQualification) return null;
              const offer = snapshot.policy.offerScopes[0]!; const native = producer.nativePurchaseV2(snapshot.ticket, offer.scopeRef);
              return native.kind === "purchase" ? { snapshot, offer, purchase: native.purchase } : null;
            });
            if (!initial || initial.offer.environment !== "sandbox") return null;
            const provider = createPartnerAlertPremiumWhopAccessProvider({ environment: process.env, offer: initial.offer,
              qualification: { ...initial.snapshot.policy.nativeQualification!, accountId: initial.offer.accountId, environment: "sandbox" },
              client: { environment: "sandbox", accountId: initial.offer.accountId, apiVersionDate: PARTNER_ALERT_WHOP_API_VERSION, bearerToken: hostedQaPremiumReadToken(cap) },
              nowUtc: () => new Date().toISOString(), transport: createPartnerAlertHostedQaWhopTransport(cap, initial.purchase, transport) });
            if (!provider) return null;
            const binding = createPartnerAlertPremiumWhopSubscriberBinding({ database: db, ownerRequest: runtime.request, pins: manifest.pins,
              guildId: manifest.guildId, offer: initial.offer, producer, writer,
              provider: { ...provider, assertCurrent: () => { current(); provider.assertCurrent(); } },
              nowUtc: () => new Date().toISOString(), createObservationRef: randomUUID, signal: abort.signal,
              readKnownMembershipIds: original => { const value = producer.captureV2(original.scope.authorityKey);
                if (value.kind !== "snapshot" || !producer.isCurrentV2(original)) throw new Error("Original Premium ticket changed.");
                const coverage = value.coverage.find(item => item.offer.scopeRef === initial.offer.scopeRef);
                return coverage?.kind === "native_coverage" ? [...new Set(coverage.collection.members.map(m => m.membershipRef))] : []; } });
            clears.push(binding.clear);
            return bindPartnerAlertNativeSubscriber(db, core, target, manifest.guildId, "sandbox", paidRoleId, { ...binding,
              observeDiscord: createPartnerAlertReviewDiscordRoleObserver({ botToken: outputConfig.discordBotToken, botUserId: manifest.botUserId,
                maximumDurationMs: 5000, transport: discord }, () => new Date().toISOString()) });
          } });
        const intent: PartnerAlertStripeRoleIntent = { operationId, scope: { communityId: row.community_id, userId: row.buyer_user_id, mappingId: row.mapping_id },
          desiredPresent: row.desired_present === 1, offerId: row.offer_id, offerVersion: row.offer_version };
        const ports = bind(intent); if (!ports) return fail();
        recordHostedQaOperation(cap, operationId, "reserved");
        const status = await reconcilePartnerAlertStripeRole(db, { intent, ...ports, nowUtc: () => new Date().toISOString() });
        recordHostedQaOperation(cap, operationId, status);
        const after = await memberRoles(); const managed = new Set(manifest.bindings.map(b => b.roleId));
        if (JSON.stringify(baseline.filter(id => !managed.has(id))) !== JSON.stringify(after.filter(id => !managed.has(id)))) throw new Error("paid_qa_unrelated_role_drift");
        return { status, replay: false, baselineRoleIds: baseline, afterRoleIds: after };
      } finally { for (const clear of clears) clear(); }
    }),
    startMirroring: () => {
      current(); if (manifest.mode !== "mirroring" || started) return fail(); started = true;
      const stopped = startPartnerAlertMirroring(db, { execution: cap, destinationGuildId: manifest.guildId, readOutput: output,
        assertCurrentStorage: () => { current(); runtime.trusted.assertCurrentRelease(); core.assertStorageCurrent(); },
        nowUtc: () => new Date().toISOString(), socketFactory, fetch: discord, reportAttention: report, onStopped: () => {} });
      if (!stopped) return fail();
      const finish = async () => { clearTimeout(timer); await stopped(); stops.delete(finish); };
      stops.add(finish); const timer = setTimeout(() => { void finish(); }, Math.max(1, hostedQaDeadline(cap) - Date.now()));
      return { stop: finish, expiresAtUtc: new Date(hostedQaDeadline(cap)).toISOString() };
    },
    stop, attention: () => [...attention],
  });
}


/** Operator entrypoint. The CLI supplies private stdin, never URL/query input. */
export async function runPartnerAlertHostedQaCommand(input: Readonly<{
  command: "gateway_ready" | "role" | "mirroring"; operationId?: string;
  envelope: import("./partner-alert-hosted-qa-authority").HostedPaidQaAuthorityInput["envelope"];
  operatorSha256: string; requestHeaders: Record<string, string>; workerEnvironment: NodeJS.ProcessEnv;
}>) {
  const { resolvePlatformBackgroundWorkerMode } = await import("../../platform/server/runtime/platform-background-worker-mode");
  if (resolvePlatformBackgroundWorkerMode(process.env) !== "disabled_isolated_staging" || process.getuid?.() !== 1001 || process.cwd() !== "/app") throw new Error("paid_qa_target_refused");
  const { openPlatformDatabase } = await import("../../platform/server/database/open-platform-database");
  const { PlatformErasureAdmission } = await import("../../platform/server/privacy/platform-erasure-admission");
  const { PARTNER_ALERT_SCHEMA_STATEMENTS } = await import("./database/partner-alert-schema");
  const { PARTNER_ALERT_CONTEXT_SCHEMA_STATEMENTS } = await import("./partner-alert-current-context");
  const { PLATFORM_PREMIUM_ROLE_SCHEMA_SQL_CURRENT_ACCESS } = await import("../../platform/server/membership/platform-premium-role-current-access-schema");
  const { issuePartnerAlertHostedQaAuthority, HOSTED_PAID_QA_JOURNAL_ROOT } = await import("./partner-alert-hosted-qa-authority");
  const { join } = await import("node:path");
  const db = openPlatformDatabase({ mode: "runtime" });
  let controller: ReturnType<typeof createPartnerAlertHostedQaController> | undefined;
  let cap: HostedPaidQaAuthority | undefined;
  const abort = new AbortController();
  const cancel = () => { abort.abort(); void controller?.stop(); };
  process.once("SIGTERM", cancel); process.once("SIGINT", cancel);
  try {
    const profileCatalogSha256 = process.env.PARTNER_ALERT_ERASURE_PROFILE_CATALOG_SHA256;
    if (!profileCatalogSha256 || !input.workerEnvironment.PARTNER_ALERT_STRIPE_ERASURE_REVIEW_PUBLIC_KEY
      || !input.workerEnvironment.PARTNER_ALERT_STRIPE_ERASURE_BINDING_KEY) throw new Error("paid_qa_configuration_refused");
    const core = PlatformErasureAdmission.bind(db, { nowUtc: () => new Date().toISOString(), maximumAdmissionMs: 30_000,
      participantStatements: [...PARTNER_ALERT_SCHEMA_STATEMENTS, ...PARTNER_ALERT_CONTEXT_SCHEMA_STATEMENTS, ...PLATFORM_PREMIUM_ROLE_SCHEMA_SQL_CURRENT_ACCESS],
      profileCatalogSha256 });
    cap = issuePartnerAlertHostedQaAuthority({ database: db, core,
      request: new Request(new URL("/__private/paid-hosted-qa", input.envelope.manifest.pins.origin), {
        method: "POST", headers: new Headers(input.requestHeaders), signal: abort.signal }),
      pins: input.envelope.manifest.pins, envelope: input.envelope, operatorSha256: input.operatorSha256,
      reviewPublicKey: input.workerEnvironment.PARTNER_ALERT_STRIPE_ERASURE_REVIEW_PUBLIC_KEY,
      journalPath: join(HOSTED_PAID_QA_JOURNAL_ROOT, input.envelope.manifest.runId + ".json"),
      journalKey: Buffer.from(input.workerEnvironment.PARTNER_ALERT_STRIPE_ERASURE_BINDING_KEY, "base64url"),
      workerEnvironment: input.workerEnvironment });
    controller = createPartnerAlertHostedQaController(cap);
    if (input.command === "gateway_ready") return await controller.gatewayReady();
    if (input.command === "role" && input.operationId) return await controller.reconcileRole(input.operationId);
    if (input.command !== "mirroring") throw new Error("paid_qa_command_refused");
    const active = controller.startMirroring();
    await new Promise<void>(resolve => {
      const timer = setTimeout(resolve, Math.max(1, Date.parse(active.expiresAtUtc) - Date.now()));
      abort.signal.addEventListener("abort", () => { clearTimeout(timer); resolve(); }, { once: true });
    });
    await active.stop(); return { stopped: true, attention: controller.attention() };
  } finally {
    try { if (controller) await controller.stop(); else if (cap) closeHostedQaAuthority(cap); } finally { process.removeListener("SIGTERM", cancel); process.removeListener("SIGINT", cancel); db.close(); }
  }
}
