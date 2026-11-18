import Database from "better-sqlite3";
import { afterEach, beforeEach, expect, it, vi } from "vitest";
import type { HostedPaidQaManifest, hostedQaRuntime } from "./partner-alert-hosted-qa-authority";
import { PartnerAlertDiscordGateway, type PartnerAlertGatewaySocket } from "./partner-alert-discord-gateway";
import { PARTNER_ALERT_SCHEMA_STATEMENTS } from "./database/partner-alert-schema";
import { platformPaidPartnerGatewaySessionMigration } from "../../platform/server/database/migrations/0210_platform_paid_partner_gateway_session";
import { PartnerAlertGatewaySessionStore } from "./partner-alert-gateway-session-store";
const state = vi.hoisted(() => ({ active: true, closed: 0, deadline: 0, packets: 0, budget: false, releaseCurrent: true, failAfterParent: false,
  runtime: null as unknown as ReturnType<typeof hostedQaRuntime>, manifest: null as unknown as HostedPaidQaManifest }));
// Controller orchestration units use explicit authority/HTTP ports. The session
// store and protocol driver are real; native owner admission has its own suite.
vi.mock("./partner-alert-admission", () => ({ requirePartnerAlertAdmission: () => ({}), PartnerAlertAdmission: { bind: () => ({}) } }));
vi.mock("./partner-alert-hosted-qa-authority", () => ({
  hostedQaRuntime: () => state.runtime, hostedQaManifest: () => state.manifest,
  assertHostedQaExecution: () => { if (!state.active) throw Error("parent ended"); },
  withPartnerAlertHostedQaParent: (_cap: unknown, fn: () => unknown) => {
    if (!state.active) throw Error("parent ended"); const result = fn();
    if (state.failAfterParent) { state.failAfterParent = false; state.active = false; throw Error("parent postcheck ended"); }
    return result;
  },
  reserveHostedQaBudget: () => { if (state.budget) throw Error("budget"); state.packets++; },
  hostedQaDeadline: () => state.deadline, closeHostedQaAuthority: () => { state.closed++; },
}));
vi.mock("./partner-alert-hosted-qa-transports", () => ({ createPartnerAlertHostedQaDiscordTransport: (_cap: unknown, fetch: typeof globalThis.fetch) => fetch }));
import { createPartnerAlertHostedQaController } from "./partner-alert-hosted-qa-controller";
let db: Database.Database;
let controller: ReturnType<typeof createPartnerAlertHostedQaController> | undefined;
let receive: (text: string) => void;
const sent = vi.fn(), close = vi.fn();
const socket: PartnerAlertGatewaySocket = { onMessage: fn => { receive = fn; }, onClose: vi.fn(), onError: vi.fn(), send: sent, close };
const factory = vi.fn(() => socket);
const http = vi.fn<typeof globalThis.fetch>(async () => Response.json({ shards: 1, session_start_limit: { remaining: 5, max_concurrency: 1 } }));
const cap = { kind: "hosted_paid_qa_authority" as const };
beforeEach(() => {
  vi.useFakeTimers(); vi.setSystemTime(new Date("2026-11-18T10:00:00.000Z"));
  vi.clearAllMocks(); state.active = true; state.closed = 0; state.packets = 0; state.budget = false; state.releaseCurrent = true; state.failAfterParent = false; state.deadline = Date.now() + 30_000;
  db = new Database(":memory:");
  for (const name of ["partner_alert_ingress_sessions", "partner_alert_deliveries"]) db.exec(PARTNER_ALERT_SCHEMA_STATEMENTS.find(sql => sql.startsWith("CREATE TABLE " + name))!);
  platformPaidPartnerGatewaySessionMigration.statements.forEach(sql => db.exec(sql));
  state.manifest = { mode: "gateway_ready", guildId: "1559172784813514803", botUserId: "1554300060483715162" } as HostedPaidQaManifest;
  state.runtime = { database: db, core: {}, trusted: { readCurrentConfiguration: () => ({ discordBotToken: "unit-bot" }), assertCurrentRelease: () => { if (!state.releaseCurrent) throw Error("release changed"); } } } as unknown as ReturnType<typeof hostedQaRuntime>;
  controller = createPartnerAlertHostedQaController(cap, { fetch: http, socketFactory: factory });
});
afterEach(async () => { await controller?.stop(); controller = undefined; db.close(); vi.restoreAllMocks(); vi.useRealTimers(); });
const emit = (value: unknown) => receive(JSON.stringify(value));
it("construction has no socket, HTTP, receiver lease or timer effects", () => {
  expect(factory).not.toHaveBeenCalled(); expect(http).not.toHaveBeenCalled();
  expect(db.prepare("SELECT COUNT(*) FROM partner_alert_ingress_sessions").pluck().get()).toBe(0);
  expect(vi.getTimerCount()).toBe(0);
});
it("a real persisted competing receiver prevents even opening a socket", async () => {
  const competitor = new PartnerAlertGatewaySessionStore(db, { botUserId: state.manifest.botUserId, destinationGuildId: state.manifest.guildId,
    leaseToken: "10000000-0000-4000-8000-000000000001", nowUtc: () => new Date().toISOString() });
  expect(competitor.acquire()).toBe(true);
  await expect(controller!.gatewayReady()).rejects.toThrow(); expect(factory).not.toHaveBeenCalled();
  await controller!.stop(); expect(competitor.isCurrent()).toBe(true);
});
it("persists actual READY and drains the driver before releasing only its receiver token", async () => {
  const result = controller!.gatewayReady();
  emit({ op: 10, d: { heartbeat_interval: 41_250 } });
  await vi.advanceTimersByTimeAsync(0);
  expect(http).toHaveBeenCalledOnce(); expect(JSON.parse(sent.mock.calls[0]![0])).toMatchObject({ op: 2 });
  emit({ op: 0, t: "READY", s: 1, d: { user: { id: state.manifest.botUserId }, session_id: "unit_session", resume_gateway_url: "wss://gateway.discord.gg/" } });
  await vi.advanceTimersByTimeAsync(0);
  await expect(result).resolves.toMatchObject({ ready: true, session: "identified" });
  expect(db.prepare("SELECT session_id,resume_sequence,lease_token FROM partner_alert_ingress_sessions").get()).toEqual({ session_id: "unit_session", resume_sequence: 1, lease_token: null });
  expect(close).toHaveBeenCalledWith(4000, "receiver_stopped");
  await controller!.stop(); await controller!.stop(); expect(state.closed).toBe(1);
});
it("parent expiry releases the owned lease and does not report READY", async () => {
  const result = controller!.gatewayReady(); state.active = false;
  await vi.advanceTimersByTimeAsync(10_000);
  await expect(result).resolves.toMatchObject({ ready: false });
  expect(db.prepare("SELECT lease_token FROM partner_alert_ingress_sessions").pluck().get()).toBeNull();
  expect(http).not.toHaveBeenCalled();
});
it("a packet budget refusal stops and drains without dispatching that packet", async () => {
  const result = controller!.gatewayReady(); state.budget = true;
  emit({ op: 10, d: { heartbeat_interval: 41_250 } });
  await vi.advanceTimersByTimeAsync(0);
  await expect(result).resolves.toMatchObject({ ready: false });
  expect(http).not.toHaveBeenCalled(); expect(sent).not.toHaveBeenCalled(); expect(state.closed).toBe(1);
});

it("releases its exact lease if initial session read fails after acquisition", async () => {
  vi.spyOn(PartnerAlertGatewaySessionStore.prototype, "loadSession").mockImplementationOnce(() => { throw Error("session changed"); });
  await expect(controller!.gatewayReady()).rejects.toThrow("session changed");
  expect(db.prepare("SELECT lease_token FROM partner_alert_ingress_sessions").pluck().get()).toBeNull();
  expect(factory).not.toHaveBeenCalled(); await controller!.stop(); expect(state.closed).toBe(1);
});
it("releases a committed acquisition even when its parent's postcheck expires", async () => {
  state.failAfterParent = true;
  await expect(controller!.gatewayReady()).rejects.toThrow("parent postcheck ended");
  expect(db.prepare("SELECT lease_token FROM partner_alert_ingress_sessions").pluck().get()).toBeNull();
  expect(factory).not.toHaveBeenCalled(); await controller!.stop(); expect(state.closed).toBe(1);
});
it("settles stop with a held exact lease when release qualification has ended", async () => {
  const result = controller!.gatewayReady();
  const before = db.prepare("SELECT lease_token FROM partner_alert_ingress_sessions").pluck().get();
  const release = vi.spyOn(PartnerAlertGatewaySessionStore.prototype, "release");
  state.releaseCurrent = false;
  await controller!.stop();
  await expect(result).resolves.toMatchObject({ ready: false, attention: ["receiver_lease_release_unavailable"] });
  expect(db.prepare("SELECT lease_token FROM partner_alert_ingress_sessions").pluck().get()).toBe(before);
  expect(release).not.toHaveBeenCalled();
  expect(state.closed).toBe(1); expect(http).not.toHaveBeenCalled();
});
it("settles a socket-stop failure and still releases only its owned database lease", async () => {
  const result = controller!.gatewayReady(); close.mockImplementationOnce(() => { throw Error("close failed"); });
  await controller!.stop();
  await expect(result).resolves.toMatchObject({ ready: false, attention: ["receiver_stop_unavailable"] });
  expect(db.prepare("SELECT lease_token FROM partner_alert_ingress_sessions").pluck().get()).toBeNull();
  expect(state.closed).toBe(1); expect(http).not.toHaveBeenCalled();
});

it("settles a driver-drain rejection and still releases its owned token", async () => {
  const result = controller!.gatewayReady();
  vi.spyOn(PartnerAlertDiscordGateway.prototype, "drain").mockRejectedValueOnce(Error("drain failed"));
  await controller!.stop();
  await expect(result).resolves.toMatchObject({ ready: false, attention: ["receiver_drain_unavailable"] });
  expect(db.prepare("SELECT lease_token FROM partner_alert_ingress_sessions").pluck().get()).toBeNull();
  expect(state.closed).toBe(1);
});
it("settles a database-release rejection without claiming or deleting its unresolved lease", async () => {
  const result = controller!.gatewayReady();
  const before = db.prepare("SELECT lease_token FROM partner_alert_ingress_sessions").pluck().get();
  vi.spyOn(PartnerAlertGatewaySessionStore.prototype, "release").mockImplementationOnce(() => { throw Error("release unavailable"); });
  await controller!.stop();
  await expect(result).resolves.toMatchObject({ ready: false, attention: ["receiver_lease_release_unavailable"] });
  expect(db.prepare("SELECT lease_token FROM partner_alert_ingress_sessions").pluck().get()).toBe(before);
  expect(state.closed).toBe(1);
});
it("does not report READY success when qualification ends after its actual session is saved", async () => {
  const saved = PartnerAlertGatewaySessionStore.prototype.saveSession;
  vi.spyOn(PartnerAlertGatewaySessionStore.prototype, "saveSession").mockImplementation(function (this: PartnerAlertGatewaySessionStore, session) {
    saved.call(this, session); state.releaseCurrent = false;
  });
  const result = controller!.gatewayReady();
  emit({ op: 10, d: { heartbeat_interval: 41_250 } }); await vi.advanceTimersByTimeAsync(0);
  emit({ op: 0, t: "READY", s: 1, d: { user: { id: state.manifest.botUserId }, session_id: "unit_session", resume_gateway_url: "wss://gateway.discord.gg/" } });
  await vi.advanceTimersByTimeAsync(0);
  await expect(result).resolves.toMatchObject({ ready: false, attention: ["receiver_lease_release_unavailable"] });
  expect(db.prepare("SELECT session_id FROM partner_alert_ingress_sessions").pluck().get()).toBe("unit_session");
  expect(db.prepare("SELECT lease_token FROM partner_alert_ingress_sessions").pluck().get()).not.toBeNull();
  await controller!.stop(); expect(state.closed).toBe(1);
});
