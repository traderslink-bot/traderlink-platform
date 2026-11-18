import { afterEach, beforeEach, expect, it, vi } from "vitest";
import type Database from "better-sqlite3";
import type { PartnerAlertGatewayConfiguration, PartnerAlertGatewayDispatch } from "./partner-alert-discord-gateway";
import type { HostedPaidQaManifest } from "./partner-alert-hosted-qa-authority";
const state = vi.hoisted(() => ({ configuration: null as unknown as PartnerAlertGatewayConfiguration, database: null as unknown as Database.Database,
  active: true, acquire: true, creates: [] as string[], allowed: true, ingest: vi.fn(async () => {}), release: vi.fn(),
  manifest: null as unknown as HostedPaidQaManifest }));
// Ingress routing policy units only; native lease/worker custody is covered by
// the controller and actual schema/Core authority tests, respectively.
vi.mock("./partner-alert-hosted-qa-authority", () => ({
  hostedQaManifest: () => state.manifest, hostedQaRuntime: () => ({ database: state.database }),
  assertHostedQaExecution: () => { if (!state.active) throw Error("expired"); },
  registerHostedQaSource: (_cap: unknown, _channel: string, id: string, action: string) => { state.creates.push(action + ":" + id); return state.allowed; },
  registerHostedQaBulkDelete: () => state.allowed, ownsHostedQaNonce: () => false,
}));
vi.mock("./partner-alert-discord-gateway", () => ({ PartnerAlertDiscordGateway: class {
  constructor(configuration: PartnerAlertGatewayConfiguration) { state.configuration = configuration; }
  start() { return true; } stop() {} async drain() {}
} }));
vi.mock("./partner-alert-gateway-session-store", () => ({ PartnerAlertGatewaySessionStore: class {
  acquire() { return state.acquire; } isCurrent() { return true; } release() { state.release(); }
} }));
vi.mock("./partner-alert-ingress-service", () => ({ PartnerAlertIngressService: class { ingest = state.ingest; } }));
vi.mock("./partner-alert-delivery-worker", () => ({ PartnerAlertDeliveryWorker: class { async runOnce() { return false; } } }));
vi.mock("./partner-alert-review-discord", () => ({ createPartnerAlertReviewDiscordResourceVerifier: () => ({}),
  createPartnerAlertReviewDiscordMessageRest: () => ({ hydrate: vi.fn() }) }));
import { startPartnerAlertMirroring } from "./partner-alert-mirroring";
const guild = "1559172784813514803", author = "1435015362558165084";
const binding = { communityId: "community", sourceGuildId: guild, destinationGuildId: guild, sourceChannelId: "11", destinationChannelId: "12", destinationRoleId: "13" };
let stopped: (() => Promise<void>) | null;
const fetch = vi.fn();
function start(execution = true) {
  return startPartnerAlertMirroring(state.database, { ...(execution ? { execution: { kind: "hosted_paid_qa_authority" as const } } : {}),
    destinationGuildId: guild, readOutput: () => ({ discordBotToken: "unit", discordBotUserId: "1554300060483715162", outputConfigurationRef: "unit",
      discordMaximumEvidenceAgeMs: 300_000, outputBindings: [binding, { ...binding, sourceChannelId: "21", destinationChannelId: "22", destinationRoleId: "23" }] }),
    assertCurrentStorage: () => {}, nowUtc: () => new Date().toISOString(), socketFactory: vi.fn(), fetch, reportAttention: vi.fn(), onStopped: vi.fn() });
}
beforeEach(() => {
  vi.useFakeTimers(); state.active = true; state.acquire = true; state.allowed = true; state.creates = []; vi.clearAllMocks();
  state.manifest = { mode: "mirroring", communityId: "community", runId: "unit_run", permittedAuthorId: author,
    bindings: [{ mappingId: "mapping", sourceChannelId: "11", destinationChannelId: "12", roleId: "13" }] } as unknown as HostedPaidQaManifest;
  state.database = { prepare: () => ({ get: () => ({ active: true }) }) } as unknown as Database.Database;
  stopped = start();
});
afterEach(async () => { await stopped?.(); vi.useRealTimers(); });
const event = (extra: Record<string, unknown> = {}): PartnerAlertGatewayDispatch => ({ type: "MESSAGE_CREATE", data: {
  guild_id: guild, channel_id: "11", id: "91", author: { id: author }, content: "TLQA unit_run synthetic", ...extra } });
it("receives only the signed binding, excluding other configured source/output channels", () => {
  expect(state.configuration.shouldReceive(guild, "11")).toBe(true);
  expect(state.configuration.shouldReceive(guild, "12")).toBe(true);
  expect(state.configuration.shouldReceive(guild, "21")).toBe(false);
  expect(state.configuration.shouldReceive(guild, "22")).toBe(false);
  expect(state.configuration.shouldReceive("999", "11")).toBe(false);
});
it.each([{ author: { id: "999" } }, { webhook_id: "999" }, { content: "ordinary unrelated message" }, { content: "TLQA another_run text" }])(
  "keeps unrelated content out of both the journal and ingress %j", async extra => {
    await state.configuration.onDispatch(event(extra)); expect(state.creates).toEqual([]); expect(state.ingest).not.toHaveBeenCalled();
  });
it("registers the exact source before ingest and does not ingest an exhausted source budget", async () => {
  await state.configuration.onDispatch(event()); expect(state.creates).toEqual(["create:91"]); expect(state.ingest).toHaveBeenCalledOnce();
  state.allowed = false; await state.configuration.onDispatch(event({ id: "92" })); expect(state.ingest).toHaveBeenCalledOnce();
});
it("refuses an unregistered edit and ignores a partial update without an edit timestamp", async () => {
  state.allowed = false;
  await state.configuration.onDispatch({ type: "MESSAGE_UPDATE", data: event().data }); expect(state.creates).toEqual([]);
  await state.configuration.onDispatch({ type: "MESSAGE_UPDATE", data: { ...event().data, edited_timestamp: new Date().toISOString() } });
  expect(state.creates).toEqual(["edit:91"]); expect(state.ingest).not.toHaveBeenCalled();
});
it("keeps ordinary non-QA ingress behavior available when the optional execution is absent", async () => {
  await stopped?.(); stopped = start(false);
  await state.configuration.onDispatch(event({ content: "ordinary message", author: { id: "999" } }));
  expect(state.ingest).toHaveBeenCalledOnce(); expect(state.creates).toEqual([]);
});
it("stops its receiver on an expired execution and releases its own lease", async () => {
  state.active = false; await vi.advanceTimersByTimeAsync(10_000);
  expect(state.release).toHaveBeenCalledOnce(); expect(fetch).not.toHaveBeenCalled();
});
