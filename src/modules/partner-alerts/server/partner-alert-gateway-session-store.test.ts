// @vitest-environment node
import { execFileSync } from "node:child_process";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import Database from "better-sqlite3";
import { expect, it, vi } from "vitest";
import { platformPaidPartnerGatewaySessionMigration } from "../../platform/server/database/migrations/0210_platform_paid_partner_gateway_session";
import { PARTNER_ALERT_SCHEMA_STATEMENTS } from "./database/partner-alert-schema";
import { PartnerAlertDiscordGateway, type PartnerAlertGatewaySocket } from "./partner-alert-discord-gateway";
import { PartnerAlertGatewaySessionStore } from "./partner-alert-gateway-session-store";

it("fences separate receiver processes and resumes from the last committed sequence and URL", () => {
  const root = mkdtempSync(join(tmpdir(), "paid-gateway-session-"));
  const path = join(root, "isolated.sqlite");
  const db = new Database(path);
  const start = Date.parse("2026-11-16T05:00:00.000Z");
  let offset = 0;
  const nowUtc = () => new Date(start + offset).toISOString();
  const identity = { botUserId: "810000000000000101", destinationGuildId: "810000000000000102" };
  const firstToken = "10000000-0000-4000-8000-000000000001";
  const nextToken = "10000000-0000-4000-8000-000000000002";
  const resumeUrl = "wss://gateway-eu-west1-b.discord.gg/?v=10&encoding=json";
  try {
    db.exec(PARTNER_ALERT_SCHEMA_STATEMENTS.find(s => s.startsWith("CREATE TABLE partner_alert_ingress_sessions"))!);
    db.exec(PARTNER_ALERT_SCHEMA_STATEMENTS.find(s => s.startsWith("CREATE TABLE partner_alert_deliveries"))!);
    platformPaidPartnerGatewaySessionMigration.statements.forEach(statement => db.exec(statement));
    const first = new PartnerAlertGatewaySessionStore(db, { ...identity, leaseToken: firstToken, nowUtc });
    expect(first.acquire()).toBe(true);
    expect(first.reserveIdentify()).toBe(true);
    first.saveSession({ sessionId: "test_session", resumeUrl, sequence: 17 });
    expect(() => first.saveSession({ sessionId: "test_session", resumeUrl, sequence: 16 })).toThrow();
    const checkChild = () => execFileSync(process.execPath, ["--require", "tsx/cjs", "-e", `
      const Database = require('better-sqlite3');
      const { PartnerAlertGatewaySessionStore } = require(process.argv[1]);
      const db = new Database(process.argv[2]);
      const claim = new PartnerAlertGatewaySessionStore(db, { ...JSON.parse(process.argv[3]), nowUtc: () => process.argv[4] });
      process.stdout.write(String(claim.acquire()));
      db.close();
    `, fileURLToPath(new URL("./partner-alert-gateway-session-store.ts", import.meta.url)), path,
    JSON.stringify({ ...identity, leaseToken: nextToken }), nowUtc()], { encoding: "utf8", timeout: 5000 });
    expect(checkChild()).toBe("false");
    offset = 45_000;
    expect(checkChild()).toBe("true");
    expect(first.renew()).toBe(false);
    expect(() => first.saveSession({ sessionId: "old", resumeUrl, sequence: 999 })).toThrow();
    first.release();
    const next = new PartnerAlertGatewaySessionStore(db, { ...identity, leaseToken: nextToken, nowUtc });
    expect(next.isCurrent()).toBe(true);
    expect(next.reserveIdentify()).toBe(false);
    let receive: ((text: string) => void) | undefined;
    const sent = vi.fn();
    const close = vi.fn();
    const socket: PartnerAlertGatewaySocket = { onMessage: callback => { receive = callback; }, onClose: vi.fn(),
      onError: vi.fn(), send: sent, close };
    const factory = vi.fn(() => socket);
    const identify = vi.fn(() => next.reserveIdentify());
    const gateway = new PartnerAlertDiscordGateway({ enabled: true, botToken: "synthetic-gateway-token", expectedBotUserId: identity.botUserId,
      socketFactory: factory, hasExclusiveReceiverLease: () => next.isCurrent(), identifyAllowed: identify,
      shouldReceive: () => false, loadSession: () => next.loadSession(), saveSession: session => next.saveSession(session),
      clearSession: () => next.clearSession(), markGap: () => next.markGap(), attention: vi.fn(), onDispatch: async () => {},
      schedule: () => 1, cancel: vi.fn(), random: () => 0.5,
    });
    expect(gateway.start()).toBe(true);
    receive!(JSON.stringify({ op: 10, d: { heartbeat_interval: 41_250 } }));
    expect(factory).toHaveBeenCalledWith(resumeUrl);
    expect(JSON.parse(sent.mock.calls[0]![0])).toMatchObject({ op: 6, d: { session_id: "test_session", seq: 17 } });
    expect(identify).not.toHaveBeenCalled();
    gateway.stop();
    expect(close).toHaveBeenCalledWith(4000, "receiver_stopped");
    offset = 80_000;
    expect(next.renew()).toBe(true);
    offset = 120_000;
    expect(next.reserveIdentify()).toBe(true);
    expect(next.reserveIdentify()).toBe(false);
    next.clearSession();
    expect(next.loadSession()).toBeNull();
    expect(db.prepare("SELECT gap_state FROM partner_alert_ingress_sessions").pluck().get()).toBe("detected");
  } finally { db.close(); rmSync(root, { recursive: true, force: true }); }
}, 20_000);
