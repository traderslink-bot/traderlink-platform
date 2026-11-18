import "server-only";
import type { PlatformPremiumNativePurchase } from "../../platform/server/membership/platform-premium-whop-native";
import { readPartnerAlertDiscordJson } from "./partner-alert-discord-channel-catalog";
import { assertPartnerAlertHostedQaCurrent, hostedQaKnownSource, hostedQaManifest, hostedQaSignal, hostedQaRuntime, hostedQaPremiumReadToken, ownsHostedQaNonce,
  ownsHostedQaDestination, recordHostedQaDestination, reserveHostedQaBudget, type HostedPaidQaAuthority } from "./partner-alert-hosted-qa-authority";

function refused(): never { throw new Error("paid_hosted_qa_transport_refused"); }
function request(input: Parameters<typeof fetch>[0], init?: RequestInit) {
  if (input instanceof Request) refused();
  const url = new URL(String(input));
  if (url.username || url.password || url.hash || url.port) refused();
  return { url, method: (init?.method ?? "GET").toUpperCase(), headers: new Headers(init?.headers) };
}
export function createPartnerAlertHostedQaDiscordTransport(cap: HostedPaidQaAuthority, transport: typeof fetch = fetch): typeof fetch {
  const manifest = hostedQaManifest(cap);
  return async (input, init) => {
    assertPartnerAlertHostedQaCurrent(cap);
    const { url, method, headers } = request(input, init);
    if (url.origin !== "https://discord.com" || !url.pathname.startsWith("/api/v10/") || url.search) refused();
    const path = url.pathname.slice("/api/v10".length);
    const expectedToken = hostedQaRuntime(cap).trusted.readCurrentConfiguration()?.discordBotToken;
    if (!expectedToken || headers.get("authorization") !== "Bot " + expectedToken) refused();
    const guild = manifest.guildId; let effect: "roleWrites" | "sends" | "edits" | "deletes" | null = null;
    let allowed = method === "GET" && ["/users/@me", "/gateway/bot", `/guilds/${guild}/roles`, `/guilds/${guild}/channels`].includes(path);
    const member = /^\/guilds\/([^/]+)\/members\/([^/]+)$/u.exec(path);
    if (member && method === "GET" && member[1] === guild && [manifest.botUserId, manifest.buyerDiscordUserId, manifest.permittedAuthorId].includes(member[2])) allowed = true;
    const role = /^\/guilds\/([^/]+)\/members\/([^/]+)\/roles\/([^/]+)$/u.exec(path);
    if (role && manifest.mode === "roles" && role[1] === guild && role[2] === manifest.buyerDiscordUserId
      && ["PUT", "DELETE"].includes(method) && manifest.bindings.some(b => b.roleId === role[3])
      && !manifest.protectedRoleIds.includes(role[3])) { allowed = true; effect = "roleWrites"; }
    const channel = /^\/channels\/([^/]+)(?:\/messages(?:\/([^/]+))?)?$/u.exec(path);
    if (channel) {
      const source = manifest.bindings.some(b => b.sourceChannelId === channel[1]);
      const destination = manifest.bindings.some(b => b.destinationChannelId === channel[1]);
      if (source || destination) {
        if (method === "GET" && path === `/channels/${channel[1]}`) allowed = true;
        if (method === "GET" && channel[2] && ((source && hostedQaKnownSource(cap, channel[1], channel[2]))
          || (destination && ownsHostedQaDestination(cap, channel[1], channel[2])))) allowed = true;
        if (manifest.mode === "mirroring" && destination) {
          if (method === "POST" && path === `/channels/${channel[1]}/messages`) { allowed = true; effect = "sends"; }
          if (channel[2] && ownsHostedQaDestination(cap, channel[1], channel[2]) && ["PATCH", "DELETE"].includes(method)) {
            allowed = true; effect = method === "PATCH" ? "edits" : "deletes";
          }
        }
      }
    }
    if (!allowed || ((method === "GET" || effect === "roleWrites" || effect === "deletes") && init?.body != null)) refused();
    let outgoingNonce: string | undefined;
    if (effect === "sends" || effect === "edits") {
      if (typeof init?.body !== "string" || init.body.length > 16_000) refused();
      const body = JSON.parse(init.body);
      const keys = effect === "sends" ? ["content", "allowed_mentions", "flags", "nonce", "enforce_nonce"] : ["content", "allowed_mentions", "flags"];
      if (JSON.stringify(Object.keys(body).sort()) !== JSON.stringify(keys.sort()) || typeof body.content !== "string"
        || body.content.length < 1 || body.content.length > 2000 || body.flags !== 4
        || JSON.stringify(body.allowed_mentions) !== JSON.stringify({ parse: [] })) refused();
      if (effect === "sends") {
        if (typeof body.nonce !== "string" || !ownsHostedQaNonce(cap, body.nonce) || body.enforce_nonce !== true) refused();
        outgoingNonce = body.nonce;
      }
    }
    reserveHostedQaBudget(cap, "http"); if (effect) reserveHostedQaBudget(cap, effect);
    const signal = AbortSignal.any([hostedQaSignal(cap), AbortSignal.timeout(5_000), ...(init?.signal ? [init.signal] : [])]);
    if (signal.aborted) refused();
    const response = await transport(url, { ...init, signal, redirect: "manual", cache: "no-store" });
    if (effect === "sends" && response.ok) {
      // Record only actual IDs; the normal transport still validates its response.
      const receipt = await readPartnerAlertDiscordJson(response.clone(), signal) as Record<string, unknown>;
      if (typeof receipt.id !== "string" || typeof receipt.channel_id !== "string" || receipt.channel_id !== channel?.[1]
        || !receipt.author || typeof receipt.author !== "object" || !("id" in receipt.author) || receipt.author.id !== manifest.botUserId
        || receipt.webhook_id != null || receipt.nonce !== outgoingNonce) refused();
      recordHostedQaDestination(cap, receipt.channel_id, receipt.id);
    }
    try { assertPartnerAlertHostedQaCurrent(cap); } catch (error) { void response.body?.cancel().catch(() => undefined); throw error; }
    return response;
  };
}
/** The purchase must come from the real admitted native producer. The normal
 * read client/decoder still verifies every membership, payment and response join. */
export function createPartnerAlertHostedQaWhopTransport(cap: HostedPaidQaAuthority, purchase: PlatformPremiumNativePurchase,
  transport: typeof fetch = fetch): typeof fetch {
  const manifest = hostedQaManifest(cap);
  if (purchase.offer.environment !== "sandbox" || purchase.payer.kind !== "bound") refused();
  const runtime = hostedQaRuntime(cap);
  const native = runtime.core.runForUsers([manifest.buyerUserId], () => {
    const producer = runtime.core.memberRepository(manifest.buyerUserId);
    const link = producer.resolveUserAuthority(manifest.buyerUserId, manifest.guildId);
    if (link.kind !== "linked") return refused();
    const snapshot = producer.captureV2(link.authorityKey);
    if (snapshot.kind !== "snapshot") return refused();
    const current = producer.nativePurchaseV2(snapshot.ticket, purchase.offer.scopeRef);
    if (current.kind !== "purchase" || JSON.stringify(current.purchase) !== JSON.stringify(purchase)) return refused();
    return current.purchase;
  });
  if (native.payer.kind !== "bound") return refused();
  const payer = native.payer.whopUserId, offer = structuredClone(native.offer);
  return async (input, init) => {
    assertPartnerAlertHostedQaCurrent(cap);
    const { url, method, headers } = request(input, init);
    if (headers.get("authorization") !== "Bearer " + hostedQaPremiumReadToken(cap)
      || headers.get("api-version-date") !== "2026-10-27-2" || init?.body != null) refused();
    if (manifest.mode !== "roles" || method !== "GET" || url.origin !== "https://sandbox-api.whop.com") refused();
    const accessPath = `/api/v1/users/${payer}/access/${offer.productId}`;
    if (url.pathname === accessPath) { if (url.search) refused(); }
    else {
      if (url.searchParams.getAll("account_id").length !== 1 || url.searchParams.get("account_id") !== offer.accountId
        || !/^\/api\/v1\/(?:variants\/plan_[A-Za-z0-9_]+|memberships(?:\/mem_[A-Za-z0-9_]+)?|payments(?:\/pay_[A-Za-z0-9_]+)?|refunds|disputes)$/u.test(url.pathname)) refused();
      if (url.pathname.startsWith("/api/v1/variants/") && url.pathname !== `/api/v1/variants/${offer.planId}`) refused();
      if (["/api/v1/memberships", "/api/v1/payments"].includes(url.pathname) && (url.searchParams.getAll("user_id").length !== 1 || url.searchParams.get("user_id") !== payer)) refused();
      if (url.pathname === "/api/v1/memberships" && JSON.stringify(url.searchParams.getAll("product_ids")) !== JSON.stringify([offer.productId])) refused();
    }
    reserveHostedQaBudget(cap, "http");
    const signal = AbortSignal.any([hostedQaSignal(cap), AbortSignal.timeout(12_000), ...(init?.signal ? [init.signal] : [])]);
    if (signal.aborted) refused();
    const response = await transport(url, { ...init, signal, redirect: "manual", cache: "no-store" });
    try { assertPartnerAlertHostedQaCurrent(cap); } catch (error) { void response.body?.cancel().catch(() => undefined); throw error; }
    return response;
  };
}
