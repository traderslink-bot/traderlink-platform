import type Database from "better-sqlite3";
import { randomUUID } from "node:crypto";
import { partnerAlertRecord } from "../contracts/partner-alert-validation";
import { readPartnerAlertDiscordJson, cancelPartnerAlertDiscordBody } from "./partner-alert-discord-channel-catalog";
import { PartnerAlertDeliveryWorker } from "./partner-alert-delivery-worker";
import { PartnerAlertDiscordGateway, validatePartnerAlertGatewayUrl, type PartnerAlertGatewaySocket } from "./partner-alert-discord-gateway";
import { createPartnerAlertDiscordMessageRest } from "./partner-alert-discord-message-rest";
import { createPartnerAlertDiscordResourceVerifier } from "./partner-alert-discord-provider-verification";
import { PartnerAlertGatewaySessionStore } from "./partner-alert-gateway-session-store";
import { PartnerAlertIngressService } from "./partner-alert-ingress-service";
import { partnerAlertOutputBindingMatches, type PartnerAlertDiscordOutputConfiguration } from "./partner-alert-provider-runtime-configuration";
import type { PartnerAlertResourceVerificationTarget } from "./partner-alert-provider-verification";
import { PARTNER_ALERT_PUBLISHING_CONSENT_SQL } from "./partner-alert-publishing-consent";

/** The database and erasure lifecycle are already verified by the caller. A
 * separate persisted lease admits at most one Gateway receiver per bot. */
export function startPartnerAlertMirroring(db: Database.Database, input: Readonly<{
  destinationGuildId: string;
  readOutput: () => PartnerAlertDiscordOutputConfiguration | null;
  assertCurrentStorage: () => void;
  nowUtc: () => string;
  socketFactory: (url: string) => PartnerAlertGatewaySocket;
  fetch: (url: string, init: RequestInit) => Promise<Response>;
  reportAttention: (reason: string) => void;
  onStopped: () => void;
}>): (() => Promise<void>) | null {
  const output = input.readOutput();
  if (!output || !output.outputBindings.some(binding => binding.destinationGuildId === input.destinationGuildId)) return null;
  input.assertCurrentStorage();
  const session = new PartnerAlertGatewaySessionStore(db, { botUserId: output.discordBotUserId,
    destinationGuildId: input.destinationGuildId, leaseToken: randomUUID(), nowUtc: input.nowUtc });
  const readMapping = db.prepare(`SELECT m.community_id AS communityId,m.source_guild_id AS sourceGuildId,
      m.source_channel_id AS sourceChannelId,m.destination_guild_id AS destinationGuildId,
      m.destination_channel_id AS destinationChannelId,m.destination_role_id AS destinationRoleId
    FROM partner_alert_mappings m WHERE m.mapping_id=? AND m.destination_channel_id=? AND m.ever_approved=1`);
  const sourceActive = db.prepare(`SELECT 1 FROM partner_alert_mappings m JOIN partner_alert_partners p USING(community_id)
    JOIN traderlink_communities c ON c.community_id=p.community_id AND c.owner_user_id=p.owner_user_id
    WHERE m.community_id=? AND m.source_guild_id=? AND m.source_channel_id=? AND m.destination_channel_id=?
      AND c.status='active' AND m.delivery_state='ready' AND p.status='active' AND p.approved_at_utc IS NOT NULL
      AND m.review_state='approved' AND m.approved_revision=m.revision AND m.activated_at_utc<=?
      AND ${PARTNER_ALERT_PUBLISHING_CONSENT_SQL}`);
  const hasSourceHistory = db.prepare(`SELECT 1 FROM partner_alert_source_messages
    WHERE community_id=? AND source_channel_id=? AND source_guild_id=? LIMIT 1`);
  let closing: Promise<void> | null = null;
  let renewTimer: ReturnType<typeof setInterval> | undefined;
  let deliveryTimer: ReturnType<typeof setTimeout> | undefined;
  let work: Promise<void> | undefined;
  let rateLimitedUntilMs = 0;
  const currentOutput = () => {
    if (closing || !session.isCurrent()) return null;
    const current = input.readOutput();
    return current?.discordBotToken === output.discordBotToken && current.discordBotUserId === output.discordBotUserId
      && current.outputConfigurationRef === output.outputConfigurationRef ? current : null;
  };
  const transport = async (url: string, init: RequestInit) => {
    if (!currentOutput() || init.signal?.aborted) throw new Error("Discord receiver authorization ended.");
    const now = Date.parse(input.nowUtc());
    if (rateLimitedUntilMs > now) {
      return Response.json({ retry_after: (rateLimitedUntilMs - now) / 1_000 }, { status: 429 });
    }
    const response = await input.fetch(url, init);
    if (response.status === 429) {
      const seconds = Number(response.headers.get("retry-after"));
      if (Number.isFinite(seconds) && seconds > 0) rateLimitedUntilMs = Date.parse(input.nowUtc()) + Math.ceil(seconds * 1_000);
    }
    return response;
  };
  const isRegistered = (target: PartnerAlertResourceVerificationTarget) => {
    const bindings = currentOutput()?.outputBindings;
    return target.destinationGuildId === input.destinationGuildId && Boolean(bindings && partnerAlertOutputBindingMatches(bindings, target));
  };
  const matchingSource = (guildId: string, channelId: string, allowOld: boolean) => {
    const bindings = currentOutput()?.outputBindings;
    return Boolean(bindings?.some(binding => binding.destinationGuildId === input.destinationGuildId
      && binding.sourceGuildId === guildId && binding.sourceChannelId === channelId
      && (sourceActive.get(binding.communityId, guildId, channelId, binding.destinationChannelId, input.nowUtc())
        || (allowOld && hasSourceHistory.get(binding.communityId, channelId, guildId)))));
  };
  const isOutputChannel = (guildId: string, channelId: string) => guildId === input.destinationGuildId
    && Boolean(currentOutput()?.outputBindings.some(binding => binding.destinationGuildId === guildId && binding.destinationChannelId === channelId));
  const verify = createPartnerAlertDiscordResourceVerifier({ botToken: output.discordBotToken, botUserId: output.discordBotUserId,
    transport, messageContentIntentEnabled: true, maximumEvidenceAgeMs: output.discordMaximumEvidenceAgeMs,
    isDestinationRoleExclusive: isRegistered, nowUtc: input.nowUtc });
  const messages = createPartnerAlertDiscordMessageRest({ botToken: output.discordBotToken, botUserId: output.discordBotUserId,
    maximumDurationMs: 8_000, transport }, {
    canReadSource: (guildId, channelId) => matchingSource(guildId, channelId, false),
    readDestination: (mappingId, channelId, action) => {
      const target = readMapping.get(mappingId, channelId) as PartnerAlertResourceVerificationTarget | undefined;
      return target && isRegistered(target) && (action === "delete"
        || sourceActive.get(target.communityId, target.sourceGuildId, target.sourceChannelId, channelId, input.nowUtc())) ? target : null;
    },
    verifyPrivateDestination: async (target, signal) => { await verify(target, signal); },
  });
  const ingress = new PartnerAlertIngressService(db, { enabled: true, nowUtc: input.nowUtc, createId: randomUUID,
    maximumNewAlertAgeMs: 120_000, hydrate: messages.hydrate });
  const delivery = new PartnerAlertDeliveryWorker(db, messages, { enabled: true, nowUtc: input.nowUtc, createId: randomUUID,
    attention: (_deliveryId, reason) => input.reportAttention(reason),
    rehydratePart: (target, stillCurrent) => ingress.rehydratePart(target, stillCurrent) });
  const gateway = new PartnerAlertDiscordGateway({ enabled: true, botToken: output.discordBotToken,
    expectedBotUserId: output.discordBotUserId, socketFactory: input.socketFactory,
    hasExclusiveReceiverLease: () => currentOutput() !== null,
    identifyAllowed: async () => {
      if (!currentOutput() || !session.reserveIdentify()) return false;
      const signal = AbortSignal.timeout(8_000);
      const response = await transport("https://discord.com/api/v10/gateway/bot", { method: "GET", signal, redirect: "manual",
        cache: "no-store", headers: { authorization: `Bot ${output.discordBotToken}`, accept: "application/json",
          "user-agent": "TradersLink Partner Channels/1.0" } });
      if (response.status !== 200) { cancelPartnerAlertDiscordBody(response.body); return false; }
      const facts = partnerAlertRecord(await readPartnerAlertDiscordJson(response, signal), "discordGatewayInfo");
      const limit = partnerAlertRecord(facts.session_start_limit, "discordGatewayLimit");
      return facts.shards === 1 && typeof facts.url === "string" && Boolean(validatePartnerAlertGatewayUrl(facts.url))
        && Number.isSafeInteger(limit.remaining) && Number(limit.remaining) > 0
        && Number.isSafeInteger(limit.max_concurrency) && Number(limit.max_concurrency) > 0;
    },
    shouldReceive: (guildId, channelId) => isOutputChannel(guildId, channelId) || matchingSource(guildId, channelId, true),
    loadSession: () => session.loadSession(), saveSession: value => session.saveSession(value), clearSession: () => session.clearSession(),
    markGap: () => session.markGap(), attention: input.reportAttention,
    onDispatch: async event => {
      const { guild_id, channel_id } = event.data;
      if (typeof guild_id !== "string" || typeof channel_id !== "string") return;
      if (isOutputChannel(guild_id, channel_id)) {
        const { author, webhook_id, id: messageId, nonce } = event.data;
        if (event.type === "MESSAGE_CREATE" && webhook_id == null && typeof messageId === "string" && typeof nonce === "string"
          && author && typeof author === "object" && "id" in author && author.id === output.discordBotUserId) {
          delivery.reconcileCreatedMessage({ guildId: guild_id, channelId: channel_id, messageId, nonce });
        }
        return;
      }
      const deletion = event.type === "MESSAGE_DELETE" || event.type === "MESSAGE_DELETE_BULK";
      if (matchingSource(guild_id, channel_id, deletion)) {
        await ingress.ingest(event);
      }
    },
    schedule: (callback, delayMs) => setTimeout(callback, delayMs).unref(),
    cancel: handle => clearTimeout(handle as ReturnType<typeof setTimeout>), random: Math.random,
  });

  const stop = () => {
    if (closing) return closing;
    closing = Promise.resolve().then(async () => {
      clearTimeout(deliveryTimer);
      clearInterval(renewTimer);
      gateway.stop();
      await Promise.allSettled([gateway.drain(), work]);
      try { session.release(); }
      catch { input.reportAttention("receiver_lease_release_unavailable"); }
      finally { input.onStopped(); }
    });
    return closing;
  };
  const scheduleDelivery = (delayMs: number) => {
    if (closing) return;
    deliveryTimer = setTimeout(() => {
      if (!currentOutput()) { void stop(); return; }
      work = delivery.runOnce().then(found => scheduleDelivery(found ? 250 : 1000))
        .catch(() => { input.reportAttention("delivery_pending_review"); scheduleDelivery(1000); });
    }, delayMs).unref();
  };
  if (!session.acquire()) return null;
  try {
    if (!gateway.start()) { session.release(); return null; }
    renewTimer = setInterval(() => {
      try {
        input.assertCurrentStorage();
        if (currentOutput() && session.renew()) return;
      } catch { /* The exact runtime is no longer qualified. */ }
      input.reportAttention("receiver_lease_unavailable");
      void stop();
    }, 10_000).unref();
    scheduleDelivery(0);
    return stop;
  } catch (error) {
    gateway.stop();
    session.release();
    throw error;
  }
}
