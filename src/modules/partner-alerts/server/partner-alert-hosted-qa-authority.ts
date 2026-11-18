import "server-only";
import { createHash, createHmac, createPublicKey, randomUUID, timingSafeEqual, verify } from "node:crypto";
import { constants, closeSync, fstatSync, fsyncSync, lstatSync, openSync, readFileSync, realpathSync, renameSync, unlinkSync, writeFileSync, type Stats } from "node:fs";
import { dirname, isAbsolute, join } from "node:path";
import type Database from "better-sqlite3";
import { assertCommunityStagingQaTarget, type CommunityStagingQaTargetPins } from "../../communities/server/community-staging-qa-target";
import { requireTraderLinkPlatformAuthenticatedRequestIdentity } from "../../platform/server/authentication/require-platform-request-scope";
import { PlatformOperatorRepository } from "../../platform/server/administration/platform-operator-repository";
import { PlatformDiscordMembershipRepository } from "../../platform/server/authentication/platform-discord-membership-repository";
import { currentPlatformErasureAdmission, type PlatformErasureAdmission } from "../../platform/server/privacy/platform-erasure-admission";
import { readPartnerAlertStripeErasureWorkerInputs } from "./partner-alert-stripe-erasure-worker-input";

export const HOSTED_PAID_QA_DOMAIN = "traderlink:paid-hosted-qa-run:v1";
export const HOSTED_PAID_QA_GUILD = "1559172784813514803";
export const HOSTED_PAID_QA_JOURNAL_ROOT = "/data/private/paid-hosted-qa/runs";
export const HOSTED_PAID_QA_BOT = "1554300060483715162";
export type HostedPaidQaBinding = Readonly<{ mappingId: string; sourceChannelId: string; destinationChannelId: string; roleId: string }>;
export type HostedPaidQaManifest = Readonly<{
  protocol: typeof HOSTED_PAID_QA_DOMAIN; runId: string; mode: "gateway_ready" | "roles" | "mirroring" | "retention";
  issuedAtUtc: string; expiresAtUtc: string; pins: CommunityStagingQaTargetPins; operatorSha256: string;
  guildId: typeof HOSTED_PAID_QA_GUILD; botUserId: typeof HOSTED_PAID_QA_BOT; communityId: string;
  buyerUserId: string; buyerDiscordUserId: string; permittedAuthorId: string;
  bindings: readonly HostedPaidQaBinding[]; protectedRoleIds: readonly string[];
  limits: Readonly<{ http: number; roleWrites: number; sends: number; edits: number; deletes: number; sourceMessages: number; gatewayPackets: number; gatewayBytes: number }>;
}>;
export type HostedPaidQaAuthority = Readonly<{ readonly kind: "hosted_paid_qa_authority" }>;
type Trusted = NonNullable<ReturnType<typeof readPartnerAlertStripeErasureWorkerInputs>>;
type Message = { channelId: string; edited: boolean; deleted: boolean };
type Payload = { version: 1; revision: number; manifestSha256: string; sessionId: string; counts: Record<string, number>;
  messages: Record<string, Message>; claims: Record<string, string>; destinations: Record<string, string>; operations: Record<string, string> };
type State = { input: HostedPaidQaAuthorityInput; manifest: HostedPaidQaManifest; trusted: Trusted; payload: Payload;
  key: Buffer; lock: Stats; lockPath: string; actorUserId: string; sessionId: string;
  headers: string; deadline: number; lastAt: number; closed: boolean; revoked: boolean; parentBinding: string | null };
export type HostedPaidQaAuthorityInput = Readonly<{
  database: Database.Database; core: PlatformErasureAdmission; request: Request; pins: CommunityStagingQaTargetPins;
  envelope: Readonly<{ manifest: HostedPaidQaManifest; signature: string }>; operatorSha256: string;
  reviewPublicKey: string; journalPath: string; journalKey: Uint8Array; workerEnvironment: NodeJS.ProcessEnv;
}>;
const states = new WeakMap<object, State>();
function fail(): never { throw new Error("paid_hosted_qa_refused"); }
const hash = (text: string) => createHash("sha256").update(text).digest("hex");
const uuid = (v: unknown): v is string => typeof v === "string" && /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/u.test(v);
const snow = (v: unknown): v is string => typeof v === "string" && /^[1-9][0-9]{0,19}$/u.test(v) && (v.length < 20 || v <= "18446744073709551615");
const hex = (v: unknown): v is string => typeof v === "string" && /^[0-9a-f]{64}$/u.test(v);
function utc(v: string): number { const n = Date.parse(v); if (!Number.isFinite(n) || new Date(n).toISOString() !== v) fail(); return n; }
function exact(v: object, keys: readonly string[]) { if (JSON.stringify(Object.keys(v).sort()) !== JSON.stringify([...keys].sort())) fail(); }
export function serializeHostedPaidQaManifest(value: HostedPaidQaManifest): Buffer {
  exact(value, ["protocol", "runId", "mode", "issuedAtUtc", "expiresAtUtc", "pins", "operatorSha256", "guildId", "botUserId", "communityId", "buyerUserId", "buyerDiscordUserId", "permittedAuthorId", "bindings", "protectedRoleIds", "limits"]);
  exact(value.pins, ["origin", "sourceCommit", "sourceVectorSha256", "schemaSha256", "buildId", "artifactSha256"]);
  exact(value.limits, ["http", "roleWrites", "sends", "edits", "deletes", "sourceMessages", "gatewayPackets", "gatewayBytes"]);
  if (value.protocol !== HOSTED_PAID_QA_DOMAIN || !uuid(value.runId) || !uuid(value.communityId) || !uuid(value.buyerUserId)
    || !snow(value.buyerDiscordUserId) || !snow(value.permittedAuthorId) || !hex(value.operatorSha256)
    || value.guildId !== HOSTED_PAID_QA_GUILD || value.botUserId !== HOSTED_PAID_QA_BOT
    || !["gateway_ready", "roles", "mirroring", "retention"].includes(value.mode)
    || !Array.isArray(value.bindings) || value.bindings.length < 1 || value.bindings.length > 2
    || !Array.isArray(value.protectedRoleIds) || !value.protectedRoleIds.length || value.protectedRoleIds.length > 100) fail();
  if (utc(value.expiresAtUtc) <= utc(value.issuedAtUtc) || utc(value.expiresAtUtc) - utc(value.issuedAtUtc) > (value.mode === "gateway_ready" ? 60_000 : 1_800_000)) fail();
  const ids = new Set<string>();
  for (const b of value.bindings) {
    exact(b, ["mappingId", "sourceChannelId", "destinationChannelId", "roleId"]);
    if (!uuid(b.mappingId) || !snow(b.sourceChannelId) || !snow(b.destinationChannelId) || !snow(b.roleId)) fail();
    for (const id of [b.mappingId, b.sourceChannelId, b.destinationChannelId, b.roleId]) { if (ids.has(id)) fail(); ids.add(id); }
    if (value.protectedRoleIds.includes(b.roleId)) fail();
  }
  if (new Set(value.protectedRoleIds).size !== value.protectedRoleIds.length || value.protectedRoleIds.some(id => !snow(id))
    || !value.protectedRoleIds.includes(HOSTED_PAID_QA_GUILD)) fail();
  const maxima = { http: value.mode === "roles" ? 40 : value.mode === "gateway_ready" ? 4 : 250,
    roleWrites: value.mode === "roles" ? 4 : 0, sends: value.mode === "mirroring" ? 6 : 0,
    edits: value.mode === "mirroring" ? 6 : 0, deletes: value.mode === "mirroring" ? 6 : 0,
    sourceMessages: value.mode === "mirroring" ? 2 : 0, gatewayPackets: 128, gatewayBytes: 4_194_304 };
  for (const key of Object.keys(maxima) as (keyof typeof maxima)[]) {
    if (!Number.isSafeInteger(value.limits[key]) || value.limits[key] < 0 || value.limits[key] > maxima[key]) fail();
  }
  return Buffer.from(JSON.stringify([HOSTED_PAID_QA_DOMAIN, value]));
}
function state(cap: HostedPaidQaAuthority): State { const s = states.get(cap); if (!s) return fail(); return s; }
function fileIdentity(path: string, mode: number) {
  const s = lstatSync(path);
  if (!s.isFile() || s.isSymbolicLink() || s.uid !== process.getuid?.() || s.nlink !== 1 || (s.mode & 0o777) !== mode) fail();
  return s;
}
function same(a: Stats, b: Stats) { return a.dev === b.dev && a.ino === b.ino && a.size === b.size && a.mtimeMs === b.mtimeMs && a.ctimeMs === b.ctimeMs; }
function parent(path: string) {
  if (!isAbsolute(path) || realpathSync(dirname(path)) !== dirname(path)) fail();
  for (let p = dirname(path);;) {
    const stat = lstatSync(p);
    if (!stat.isDirectory() || stat.isSymbolicLink()) fail();
    if (p === dirname(path) && (stat.uid !== process.getuid?.() || (stat.mode & 0o777) !== 0o700)) fail();
    if (p === dirname(p)) break; p = dirname(p);
  }
}
function mac(key: Buffer, value: Payload) { return createHmac("sha256", key).update(HOSTED_PAID_QA_DOMAIN + ":journal\0" + JSON.stringify(value)).digest(); }
function readJournal(s: State): Payload {
  const path = s.input.journalPath; const before = fileIdentity(path, 0o600);
  if (before.size < 1 || before.size > 131_072) fail();
  const fd = openSync(path, constants.O_RDONLY | constants.O_NOFOLLOW);
  try {
    if (!same(before, fstatSync(fd))) fail();
    const raw = readFileSync(fd); if (!same(before, fstatSync(fd)) || !same(before, fileIdentity(path, 0o600))) fail();
    const v = JSON.parse(raw.toString("utf8")) as { payload: Payload; mac: string };
    exact(v, ["payload", "mac"]); const expected = mac(s.key, v.payload);
    if (typeof v.mac !== "string" || !hex(v.mac) || !timingSafeEqual(expected, Buffer.from(v.mac, "hex"))
      || v.payload.version !== 1 || !Number.isSafeInteger(v.payload.revision) || v.payload.revision < 1
      || v.payload.manifestSha256 !== s.payload.manifestSha256 || v.payload.sessionId !== s.sessionId) fail();
    return v.payload;
  } finally { closeSync(fd); }
}
function writeJournal(s: State, next: Payload, initial = false): void {
  parent(s.input.journalPath);
  if (!initial) { const old = readJournal(s); if (old.revision !== s.payload.revision) fail(); }
  const bytes = Buffer.from(JSON.stringify({ payload: next, mac: mac(s.key, next).toString("hex") }));
  if (bytes.length > 131_072) fail();
  const tmp = join(dirname(s.input.journalPath), ".paid-qa-" + randomUUID());
  let fd: number | undefined;
  try {
    fd = openSync(tmp, constants.O_WRONLY | constants.O_CREAT | constants.O_EXCL | constants.O_NOFOLLOW, 0o600);
    writeFileSync(fd, bytes); fsyncSync(fd); closeSync(fd); fd = undefined;
    if (initial) {
      const destination = openSync(s.input.journalPath, constants.O_WRONLY | constants.O_CREAT | constants.O_EXCL | constants.O_NOFOLLOW, 0o600);
      try { writeFileSync(destination, bytes); fsyncSync(destination); } finally { closeSync(destination); }
      unlinkSync(tmp);
    } else renameSync(tmp, s.input.journalPath);
    const directory = openSync(dirname(s.input.journalPath), constants.O_RDONLY | constants.O_DIRECTORY | constants.O_NOFOLLOW);
    try { fsyncSync(directory); } finally { closeSync(directory); }
    s.payload = next;
  } finally { if (fd !== undefined) closeSync(fd); try { unlinkSync(tmp); } catch { /* Already atomically installed. */ } }
}
function mutate(s: State, update: (payload: Payload) => void) {
  const current = readJournal(s); if (current.revision !== s.payload.revision || !same(s.lock, fileIdentity(s.lockPath, 0o600))) fail();
  const next = structuredClone(current); update(next); next.revision++; if (!Number.isSafeInteger(next.revision)) fail(); writeJournal(s, next);
}
function checkStatic(s: State, settlement = false) {
  if (currentPlatformErasureAdmission(s.input.database) !== s.input.core || !s.input.database.open) fail();
  s.trusted.assertCurrentRelease(); s.input.core.assertStorageCurrent();
  if (!settlement) {
    const at = Date.now();
    if (at < s.lastAt || at >= s.deadline) s.revoked = true;
    if (s.closed || s.revoked || s.input.request.signal.aborted || at < s.lastAt || at >= s.deadline
      || JSON.stringify([...s.input.request.headers]) !== s.headers) fail();
    s.lastAt = at;
    if (s.parentBinding !== null) {
      const identity = requireTraderLinkPlatformAuthenticatedRequestIdentity(s.input.request.headers, { environment: process.env, databasePath: s.input.database.name });
      if (identity.mode !== "platform_session" || identity.sessionId !== s.sessionId || identity.scope.userId !== s.actorUserId) fail();
      const grant = new PlatformOperatorRepository(s.input.database).findActive();
      const membership = new PlatformDiscordMembershipRepository(s.input.database).findCurrent(s.actorUserId, s.manifest.guildId);
      if (hash(JSON.stringify([grant, membership])) !== s.parentBinding) fail();
    }
  }
}
export function withPartnerAlertHostedQaParent<T>(cap: HostedPaidQaAuthority, operation: () => T): T {
  const s = state(cap); checkStatic(s);
  if (s.input.database.inTransaction) fail();
  assertCommunityStagingQaTarget(s.input.database, s.manifest.pins);
  return s.input.core.withRequestAuditFrame(s.input.request, process.env, frame => {
    const identity = requireTraderLinkPlatformAuthenticatedRequestIdentity(s.input.request.headers, { environment: process.env, databasePath: s.input.database.name });
    if (identity.mode !== "platform_session" || identity.sessionId !== s.sessionId || identity.scope.userId !== s.actorUserId) fail();
    s.input.core.attachRequestPrincipal(identity, () => {
      const latest = requireTraderLinkPlatformAuthenticatedRequestIdentity(s.input.request.headers, { environment: process.env, databasePath: s.input.database.name });
      if (latest.mode !== "platform_session" || latest.sessionId !== s.sessionId || latest.scope.userId !== s.actorUserId) fail();
    });
    const owner = frame.authorize(identity, s.input.request.headers);
    if (owner.role !== "journal_owner_admin" || owner.mode !== "production_discord_owner" || !owner.permissions.includes("manage_users")
      || !owner.discordOwnerVerifiedAtUtc || utc(owner.discordOwnerVerifiedAtUtc) > Date.now()
      || Date.now() - utc(owner.discordOwnerVerifiedAtUtc) >= 300_000) fail();
    s.input.core.retainOwnerScope(owner); s.input.core.requirePlatformOwner();
    const result = operation(); frame.revalidate(owner, identity, s.input.request.headers); checkStatic(s); return result;
  });
}
export function issuePartnerAlertHostedQaAuthority(input: HostedPaidQaAuthorityInput): HostedPaidQaAuthority {
  input = Object.freeze({ ...input, pins: Object.freeze({ ...input.pins }), workerEnvironment: Object.freeze({ ...input.workerEnvironment }) });
  const manifest = structuredClone(input.envelope.manifest); const bytes = serializeHostedPaidQaManifest(manifest);
  const review = createPublicKey(input.reviewPublicKey);
  if (review.asymmetricKeyType !== "ed25519" || !/^[A-Za-z0-9_-]{86}$/u.test(input.envelope.signature)
    || !verify(null, bytes, review, Buffer.from(input.envelope.signature, "base64url"))
    || manifest.operatorSha256 !== input.operatorSha256 || JSON.stringify(manifest.pins) !== JSON.stringify(input.pins)
    || utc(manifest.issuedAtUtc) > Date.now() || utc(manifest.expiresAtUtc) <= Date.now()
    || input.request.method !== "POST" || new URL(input.request.url).origin !== input.pins.origin
    || input.request.headers.get("origin") !== input.pins.origin || input.request.headers.get("sec-fetch-site") === "cross-site"
    || input.journalKey.byteLength !== 32 || input.database.inTransaction
    || input.journalPath !== join(HOSTED_PAID_QA_JOURNAL_ROOT, manifest.runId + ".json")) fail();
  assertCommunityStagingQaTarget(input.database, input.pins);
  if (currentPlatformErasureAdmission(input.database) !== input.core) fail();
  const env = input.workerEnvironment;
  for (const name of Object.keys(process.env).filter(n => n.startsWith("RAILWAY_") || n.startsWith("TRADERLINK_PLATFORM_ISOLATED_STAGING_"))) if (env[name] !== process.env[name]) fail();
  for (const name of ["NODE_ENV", "TRADERLINK_PLATFORM_DB_PATH", "TRADERLINK_PLATFORM_PUBLIC_ORIGIN", "TRADERLINK_PLATFORM_BACKGROUND_WORKERS_MODE", "DISCORD_GUILD_ID"]) if (env[name] !== process.env[name]) fail();
  if (env.PARTNER_ALERT_STRIPE_ERASURE_REVIEW_PUBLIC_KEY !== input.reviewPublicKey) fail();
  const trusted = readPartnerAlertStripeErasureWorkerInputs(input.database, env);
  if (!trusted || trusted.releaseFormat !== "v5" || trusted.effectMode !== "discord_roles" || trusted.schemaSha256 !== input.pins.schemaSha256) fail();
  const bindingKey = trusted.erasureRuntime.binding.key;
  if (bindingKey.byteLength !== 32 || !timingSafeEqual(Buffer.from(bindingKey), Buffer.from(input.journalKey))) fail();
  const output = trusted.readCurrentConfiguration();
  if (!output || output.discordBotUserId !== manifest.botUserId || manifest.protectedRoleIds.some(id => !trusted.forbiddenRoleIds.includes(id))
    || trusted.forbiddenRoleIds.some(id => !manifest.protectedRoleIds.includes(id))) fail();
  for (const b of manifest.bindings) if (!output.outputBindings.some(x => x.communityId === manifest.communityId && x.sourceGuildId === manifest.guildId
    && x.destinationGuildId === manifest.guildId && x.sourceChannelId === b.sourceChannelId && x.destinationChannelId === b.destinationChannelId && x.destinationRoleId === b.roleId)) fail();
  const identity = requireTraderLinkPlatformAuthenticatedRequestIdentity(input.request.headers, { environment: process.env, databasePath: input.database.name });
  if (identity.mode !== "platform_session" || !identity.sessionId) fail();
  parent(input.journalPath);
  const lockPath = input.journalPath + ".lock";
  const fd = openSync(lockPath, constants.O_WRONLY | constants.O_CREAT | constants.O_EXCL | constants.O_NOFOLLOW, 0o600);
  try { writeFileSync(fd, JSON.stringify({ runId: manifest.runId, pid: process.pid })); fsyncSync(fd); } finally { closeSync(fd); }
  const cap = Object.freeze({ kind: "hosted_paid_qa_authority" as const });
  const payload: Payload = { version: 1, revision: 1, manifestSha256: hash(bytes.toString("utf8")), sessionId: identity.sessionId,
    counts: {}, messages: {}, claims: {}, destinations: {}, operations: {} };
  const s: State = { input, manifest, trusted, payload, key: Buffer.from(input.journalKey), lock: fileIdentity(lockPath, 0o600), lockPath,
    actorUserId: identity.scope.userId, sessionId: identity.sessionId, headers: JSON.stringify([...input.request.headers]),
    deadline: Math.min(utc(manifest.expiresAtUtc), Date.now() + 120_000), lastAt: Date.now(), closed: false, revoked: false, parentBinding: null };
  states.set(cap, s);
  try {
    withPartnerAlertHostedQaParent(cap, () => {});
    s.parentBinding = hash(JSON.stringify([new PlatformOperatorRepository(input.database).findActive(),
      new PlatformDiscordMembershipRepository(input.database).findCurrent(s.actorUserId, manifest.guildId)]));
    // Parent proof's ORIGINAL freshness deadline can only shorten this wave.
    input.core.withRequestAuditFrame(input.request, process.env, frame => {
      input.core.attachRequestPrincipal(identity, () => requireTraderLinkPlatformAuthenticatedRequestIdentity(input.request.headers, { environment: process.env, databasePath: input.database.name }));
      const owner = frame.authorize(identity, input.request.headers); input.core.retainOwnerScope(owner);
      s.deadline = Math.min(s.deadline, utc(owner.discordOwnerVerifiedAtUtc!) + 300_000);
    });
    try { fileIdentity(input.journalPath, 0o600); s.payload = readJournal(s); }
    catch (error) { if ((error as NodeJS.ErrnoException).code !== "ENOENT") throw error; writeJournal(s, payload, true); }
    return cap;
  } catch (error) { states.delete(cap); if (same(s.lock, fileIdentity(lockPath, 0o600))) unlinkSync(lockPath); throw error; }
}
export function assertPartnerAlertHostedQaCurrent(cap: HostedPaidQaAuthority): void { withPartnerAlertHostedQaParent(cap, () => {}); }
export function hostedQaManifest(cap: HostedPaidQaAuthority): HostedPaidQaManifest { return structuredClone(state(cap).manifest); }
export function hostedQaRuntime(cap: HostedPaidQaAuthority) { const s = state(cap); checkStatic(s); return { database: s.input.database, core: s.input.core, request: s.input.request, trusted: s.trusted }; }
export function reserveHostedQaBudget(cap: HostedPaidQaAuthority, counter: keyof HostedPaidQaManifest["limits"], amount = 1): void {
  const s = state(cap); assertPartnerAlertHostedQaCurrent(cap);
  if (!Number.isSafeInteger(amount) || amount < 1) fail();
  mutate(s, p => { const next = (p.counts[counter] ?? 0) + amount; if (next > s.manifest.limits[counter]) fail(); p.counts[counter] = next; });
}
export function registerHostedQaSource(cap: HostedPaidQaAuthority, channelId: string, messageId: string, action: "create" | "edit" | "delete"): boolean {
  const s = state(cap); assertPartnerAlertHostedQaCurrent(cap);
  if (!snow(messageId) || !s.manifest.bindings.some(b => b.sourceChannelId === channelId)) return false;
  let accepted = false;
  mutate(s, p => {
    const old = p.messages[messageId];
    if (action === "create") { if (old) return; if ((p.counts.sourceMessages ?? 0) >= s.manifest.limits.sourceMessages) return;
      p.counts.sourceMessages = (p.counts.sourceMessages ?? 0) + 1; p.messages[messageId] = { channelId, edited: false, deleted: false }; accepted = true; }
    else if (old?.channelId === channelId && !old.deleted && !(action === "edit" && old.edited)) {
      if (action === "edit") old.edited = true; else old.deleted = true; accepted = true;
    }
  }); return accepted;
}
export function hostedQaDeliverySql(cap: HostedPaidQaAuthority, alias: "d" | "partner_alert_deliveries", phase: "work" | "settle" | "associated" = "work"): Readonly<{ sql: string; parameters: string[] }> {
  const s = state(cap); checkStatic(s, phase !== "work");
  if (s.input.database.inTransaction) s.input.core.assertCurrent(); else if (phase === "work") assertPartnerAlertHostedQaCurrent(cap);
  const clauses: string[] = [], parameters: string[] = [];
  for (const [id, message] of Object.entries(s.payload.messages)) for (const b of s.manifest.bindings.filter(x => x.sourceChannelId === message.channelId)) {
    clauses.push(`(${alias}.community_id=? AND ${alias}.mapping_id=? AND ${alias}.source_channel_id=? AND ${alias}.message_id=?)`);
    parameters.push(s.manifest.communityId, b.mappingId, b.sourceChannelId, id);
  }
  let sql = clauses.length ? "(" + clauses.join(" OR ") + ")" : "0";
  if (phase === "settle") { const ids = Object.keys(s.payload.claims); sql += ids.length ? ` AND ${alias}.delivery_id IN (${ids.map(() => "?").join(",")})` : " AND 0"; parameters.push(...ids); }
  return { sql, parameters };
}
export function hostedQaDeadline(cap: HostedPaidQaAuthority): number { return state(cap).deadline; }
export function hostedQaSignal(cap: HostedPaidQaAuthority): AbortSignal {
  const s = state(cap); checkStatic(s);
  return AbortSignal.any([s.input.request.signal, AbortSignal.timeout(Math.max(1, s.deadline - Date.now()))]);
}
export function hostedQaKnownSource(cap: HostedPaidQaAuthority, channelId: string, messageId: string): boolean {
  return state(cap).payload.messages[messageId]?.channelId === channelId;
}
export function ownHostedQaClaim(cap: HostedPaidQaAuthority, deliveryId: string, token: string): void {
  const s = state(cap); checkStatic(s); if (!uuid(deliveryId) || !uuid(token)) fail();
  mutate(s, p => {
    const previous = p.claims[deliveryId];
    if (previous && previous !== token) {
      const row = s.input.database.prepare("SELECT status,lease_token,outcome_json FROM partner_alert_deliveries WHERE delivery_id=?").get(deliveryId) as { status: string; lease_token: string | null; outcome_json: string | null } | undefined;
      if (!row || !["pending", "failed"].includes(row.status) || row.lease_token || !row.outcome_json) fail();
      const outcome = JSON.parse(row.outcome_json);
      if (outcome.operationId !== previous || !["retry", "not_written"].includes(outcome.result?.kind)) fail();
    }
    p.claims[deliveryId] = token;
  });
}
export function ownsHostedQaClaim(cap: HostedPaidQaAuthority, deliveryId: string, token: string): boolean { const s = state(cap); checkStatic(s, true); return s.payload.claims[deliveryId] === token; }
export function recordHostedQaDestination(cap: HostedPaidQaAuthority, channelId: string, messageId: string): void {
  const s = state(cap); checkStatic(s, true);
  if (!snow(messageId) || !s.manifest.bindings.some(b => b.destinationChannelId === channelId)) fail();
  mutate(s, p => { if (p.destinations[messageId] && p.destinations[messageId] !== channelId) fail(); p.destinations[messageId] = channelId; });
}
export function ownsHostedQaDestination(cap: HostedPaidQaAuthority, channelId: string, messageId: string): boolean { return state(cap).payload.destinations[messageId] === channelId; }
export function readHostedQaOperation(cap: HostedPaidQaAuthority, id: string): string | null { return state(cap).payload.operations[id] ?? null; }
export function recordHostedQaOperation(cap: HostedPaidQaAuthority, id: string, result: string): void {
  const s = state(cap); checkStatic(s, true); if (!uuid(id) || !["reserved", "applied", "held", "uncertain"].includes(result)) fail();
  mutate(s, p => { if (p.operations[id] && p.operations[id] !== "reserved" && p.operations[id] !== result) fail(); p.operations[id] = result; });
}
export function closeHostedQaAuthority(cap: HostedPaidQaAuthority): void {
  const s = state(cap); if (s.closed) return; s.closed = true;
  if (!same(s.lock, fileIdentity(s.lockPath, 0o600))) fail(); unlinkSync(s.lockPath);
}

export function hostedQaPremiumReadToken(cap: HostedPaidQaAuthority): string {
  const s = state(cap); checkStatic(s);
  const token = s.input.workerEnvironment.PARTNER_ALERT_PREMIUM_WHOP_SANDBOX_READ_TOKEN;
  if (!token || /[\u0000-\u0020\u007f]/u.test(token)) return fail(); return token;
}
export function ownsHostedQaNonce(cap: HostedPaidQaAuthority, nonce: string): boolean {
  return Object.keys(state(cap).payload.claims).filter(id => id.replace(/-/gu, "").slice(0, 25) === nonce).length === 1;
}

export function assertHostedQaExecution(cap: HostedPaidQaAuthority): void {
  const s = state(cap); checkStatic(s);
  if (s.input.database.inTransaction) s.input.core.assertCurrent(); else assertPartnerAlertHostedQaCurrent(cap);
}
export function registerHostedQaBulkDelete(cap: HostedPaidQaAuthority, channelId: string, ids: readonly string[]): boolean {
  const s = state(cap); assertPartnerAlertHostedQaCurrent(cap);
  if (!ids.length || ids.length > 2 || new Set(ids).size !== ids.length
    || ids.some(id => !snow(id) || s.payload.messages[id]?.channelId !== channelId || s.payload.messages[id]?.deleted)) return false;
  mutate(s, p => { for (const id of ids) p.messages[id]!.deleted = true; }); return true;
}
