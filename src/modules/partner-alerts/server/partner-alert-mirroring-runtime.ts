import "server-only";

import { resolveTraderLinkDiscordGuildId } from "../../platform/server/authentication/platform-discord-configuration";
import { platformPaidPartnerGatewaySessionMigration } from "../../platform/server/database/migrations/0210_platform_paid_partner_gateway_session";
import { openPlatformDatabase } from "../../platform/server/database/open-platform-database";
import { PlatformErasureAdmission } from "../../platform/server/privacy/platform-erasure-admission";
import { PartnerAlertAdmission } from "./partner-alert-admission";
import type { PartnerAlertGatewaySocket } from "./partner-alert-discord-gateway";
import { bindPartnerAlertErasureRuntime } from "./partner-alert-erasure-runtime";
import { startPartnerAlertMirroring } from "./partner-alert-mirroring";
import { readPartnerAlertStripeErasureWorkerInputs } from "./partner-alert-stripe-erasure-worker-input";

const slot = Symbol.for("traderlink.partner-alert.mirroring-runtime");
const state = globalThis as typeof globalThis & { [slot]?: () => Promise<void> };

function nativeSocket(url: string): PartnerAlertGatewaySocket {
  const socket = new WebSocket(url);
  return {
    onMessage: handler => socket.addEventListener("message", event => handler(typeof event.data === "string" ? event.data : "")),
    onClose: handler => socket.addEventListener("close", event => handler(event.code)),
    onError: handler => socket.addEventListener("error", handler),
    send: value => socket.send(value),
    close: (code, reason) => socket.close(code, reason),
  };
}

/** Startup owns the qualified connection, duplicate-start guard and standby
 * retry. The receiver itself never opens config or finds provider credentials. */
export function startConfiguredPartnerAlertMirroring(verifiedDatabasePath: string | undefined): (() => Promise<void>) | null {
  const env = process.env;
  const enabled = () => env.NODE_ENV === "production" && env.PARTNER_ALERT_MIRRORING_ENABLED === "true"
    && env.PARTNER_ALERT_LIFECYCLE_ENABLED === "true" && env.PARTNER_ALERT_REQUEST_RUNTIME_ENABLED === "true"
    && env.PARTNER_ALERT_DISCORD_MESSAGE_CONTENT_INTENT_ENABLED === "true";
  if (!enabled()) return null;
  if (state[slot]) return state[slot];
  if (!verifiedDatabasePath || verifiedDatabasePath !== env.TRADERLINK_PLATFORM_DB_PATH) {
    throw new Error("Partner Channel delivery database scope changed.");
  }
  const db = openPlatformDatabase({ mode: "runtime", databasePath: verifiedDatabasePath, environment: env });
  try {
    const trusted = readPartnerAlertStripeErasureWorkerInputs(db, env);
    if (!trusted?.gatewayDescriptorChecksum || !trusted.appliedLedgerSha256) {
      throw new Error("Partner Channel delivery requires reviewed receiver storage.");
    }
    const core = PlatformErasureAdmission.bind(db, { nowUtc: trusted.nowUtc, maximumAdmissionMs: 30_000,
      profileCatalogSha256: trusted.profileCatalogSha256, participantStatements: platformPaidPartnerGatewaySessionMigration.statements });
    PartnerAlertAdmission.bind(db);
    bindPartnerAlertErasureRuntime(db, trusted.erasureRuntime);
    const guildId = resolveTraderLinkDiscordGuildId(env);
    const readOutput = () => enabled() && env.TRADERLINK_PLATFORM_DB_PATH === verifiedDatabasePath
      ? trusted.readCurrentConfiguration() : null;
    const reportAttention = (reason: string) => console.error("Partner Channel alert delivery needs attention.", { reason });
    let scheduled: ReturnType<typeof setTimeout> | undefined;
    let receiver: (() => Promise<void>) | null = null;
    let closing: Promise<void> | null = null;
    const stop = () => {
      if (closing) return closing;
      clearTimeout(scheduled);
      closing = Promise.resolve().then(() => receiver?.()).finally(() => {
        db.close();
        if (state[slot] === stop) delete state[slot];
      });
      return closing;
    };
    const start = () => {
      if (closing) return;
      if (!readOutput()) { void stop(); return; }
      receiver = startPartnerAlertMirroring(db, { destinationGuildId: guildId, readOutput, nowUtc: trusted.nowUtc,
        assertCurrentStorage: () => { trusted.assertCurrentRelease(); core.assertStorageCurrent(); },
        socketFactory: nativeSocket, fetch: (url, init) => fetch(url, init), reportAttention,
        onStopped: () => { receiver = null; void stop(); },
      });
      if (!receiver) scheduled = setTimeout(() => {
        try { start(); }
        catch { reportAttention("receiver_start_unavailable"); void stop(); }
      }, 5_000).unref();
    };
    state[slot] = stop;
    try { start(); }
    catch (error) { delete state[slot]; throw error; }
    return stop;
  } catch (error) {
    db.close();
    throw error;
  }
}
