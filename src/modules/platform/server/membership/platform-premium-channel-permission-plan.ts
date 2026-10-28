import { createHash } from "node:crypto";
import { PlatformPremiumError, premiumInteger, premiumRef, premiumSnowflake, premiumUtc } from "../../contracts/platform-premium-access";

export type PremiumChannelOverwrite = Readonly<{ id: string; type: 0 | 1; allow: string; deny: string }>;
export type PremiumPermissionRole = Readonly<{ id: string; position: number; permissions: string; managed: boolean }>;
export type PremiumPermissionChannel = Readonly<{
  id: string; guildId: string; type: number; parentId: string | null;
  /** Missing/obfuscated overwrites must not be normalised into an empty array. */
  overwrites: readonly PremiumChannelOverwrite[];
}>;
export type PremiumPermissionGraph = Readonly<{
  guildId: string; observedAtUtc: string; roles: readonly PremiumPermissionRole[];
  channels: readonly PremiumPermissionChannel[];
  bot: Readonly<{ userId: string; roleIds: readonly string[] }>;
}>;
export type PremiumPermissionDesignation = Readonly<{
  channelId: string; parentId: string | null; kind: "ordinary" | "hide";
  /** Explicit consent required if changing an already category-synced child. */
  allowCategoryUnsync: boolean;
}>;
export type PremiumPermissionPolicy = Readonly<{
  guildId: string; sourceRoleId: string; complimentaryRoleId: string; botUserId: string;
  approvalRef: string; revision: number; maximumSnapshotAgeMs: number;
  designations: readonly PremiumPermissionDesignation[];
  excludedChannelIds: readonly string[];
}>;
export type PremiumPermissionIssue = "role_invalid" | "source_privileged" | "channel_missing"
  | "channel_excluded" | "channel_type" | "parent_changed" | "category_sync_review"
  | "source_permission_unsupported" | "other_role_deny_conflict" | "hide_source_visible"
  | "hide_allow_conflict" | "unreviewed_source_access" | "unreviewed_complimentary_access";
export type PremiumPermissionRow = Readonly<{
  channelId: string; kind: "ordinary" | "hide";
  before: PremiumChannelOverwrite | null; desired: PremiumChannelOverwrite | null;
  state: "same" | "change" | "review";
  issues: readonly PremiumPermissionIssue[];
  /** Raw supported flags include thread-inherited capabilities. Parent SEND
   * denial does not erase SEND_MESSAGES_IN_THREADS or make attachment drift safe. */
  sourceChannelFlags: string | null; desiredChannelFlags: string | null;
  currentExtraFlags: string | null; currentMissingFlags: string | null;
  guildExtraFlags: string | null;
  categorySynced: boolean;
  actorCanWrite: boolean;
}>;
export type PremiumChannelPermissionPlan = Readonly<{
  kind: "read_only_permission_plan"; canApply: false;
  policy: PremiumPermissionPolicy; policyDigest: string; guardDigest: string; diffDigest: string;
  observedAtUtc: string; validUntilUtc: string;
  rows: readonly PremiumPermissionRow[];
  globalIssues: readonly PremiumPermissionIssue[];
  unreviewedChannelIds: readonly string[];
}>;
const bit = (n: number) => BigInt(1) << BigInt(n);
const mask = (values: readonly number[]) => values.reduce((value, n) => value | bit(n), BigInt(0));
const VIEW = bit(10); const ADMIN = bit(3); const MANAGE_ROLES = bit(28);
/** Ordinary user capabilities only. Guild-only nickname and staff powers are
 * deliberately not translated into complimentary channel grants. */
export const PREMIUM_ORDINARY_CHANNEL_MASK = mask([0, 6, 10, 11, 12, 14, 15, 16, 18, 31, 35, 36, 37, 38, 39, 46, 49, 50]).toString();
const SAFE = BigInt(PREMIUM_ORDINARY_CHANNEL_MASK);
const PRIVILEGED = mask([1, 2, 3, 4, 5, 7, 13, 17, 22, 23, 24, 27, 28, 29, 30, 33, 34, 40, 41, 51, 52]);
const KNOWN_NON_TEXT = mask([8, 9, 19, 20, 21, 25, 26, 32, 42, 43, 44, 45, 48]);
export function premiumPermissionBits(value: string): bigint {
  if (typeof value !== "string" || !/^(0|[1-9][0-9]{0,39})$/u.test(value)) throw new PlatformPremiumError("invalid");
  return BigInt(value);
}
export function premiumPermissionDigest(value: unknown): string {
  const text = JSON.stringify(value);
  if (typeof text !== "string") throw new PlatformPremiumError("invalid");
  return createHash("sha256").update(text).digest("hex");
}
function overwrite(value: PremiumChannelOverwrite): PremiumChannelOverwrite {
  premiumSnowflake(value.id);
  if (![0, 1].includes(value.type)) throw new PlatformPremiumError("invalid");
  const allow = premiumPermissionBits(value.allow); const deny = premiumPermissionBits(value.deny);
  if (allow & deny) throw new PlatformPremiumError("invalid");
  return Object.freeze({ id: value.id, type: value.type, allow: allow.toString(), deny: deny.toString() });
}
function compareId(a: Readonly<{ id: string }>, b: Readonly<{ id: string }>): number { return a.id.localeCompare(b.id, "en"); }
function ordered(values: readonly PremiumChannelOverwrite[]): readonly PremiumChannelOverwrite[] {
  return Object.freeze(values.map(overwrite).sort((a, b) => a.type - b.type || compareId(a, b)));
}
export function samePremiumChannelOverwrite(a: PremiumChannelOverwrite | null, b: PremiumChannelOverwrite | null): boolean {
  return a === null || b === null ? a === b : a.id === b.id && a.type === b.type
    && premiumPermissionBits(a.allow) === premiumPermissionBits(b.allow) && premiumPermissionBits(a.deny) === premiumPermissionBits(b.deny);
}
export function normalizePremiumPermissionPolicy(input: PremiumPermissionPolicy): PremiumPermissionPolicy {
  [input.guildId, input.sourceRoleId, input.complimentaryRoleId, input.botUserId].forEach(premiumSnowflake);
  if (new Set([input.guildId, input.sourceRoleId, input.complimentaryRoleId]).size !== 3) throw new PlatformPremiumError("invalid");
  premiumRef(input.approvalRef); premiumInteger(input.revision); premiumInteger(input.maximumSnapshotAgeMs, 1, 300_000);
  if (!Array.isArray(input.designations) || input.designations.length < 1 || input.designations.length > 500
    || !Array.isArray(input.excludedChannelIds) || input.excludedChannelIds.length > 500) throw new PlatformPremiumError("invalid");
  const excluded = [...new Set(input.excludedChannelIds.map(premiumSnowflake))].sort();
  const seen = new Set<string>();
  const designations = input.designations.map(d => {
    premiumSnowflake(d.channelId); if (d.parentId !== null) premiumSnowflake(d.parentId);
    if (seen.has(d.channelId) || excluded.includes(d.channelId) || !["ordinary", "hide"].includes(d.kind)
      || typeof d.allowCategoryUnsync !== "boolean") throw new PlatformPremiumError("invalid");
    seen.add(d.channelId);
    return Object.freeze({ channelId: d.channelId, parentId: d.parentId, kind: d.kind, allowCategoryUnsync: d.allowCategoryUnsync });
  }).sort((a, b) => a.channelId.localeCompare(b.channelId, "en"));
  return Object.freeze({ guildId: input.guildId, sourceRoleId: input.sourceRoleId,
    complimentaryRoleId: input.complimentaryRoleId, botUserId: input.botUserId, approvalRef: input.approvalRef,
    revision: input.revision, maximumSnapshotAgeMs: input.maximumSnapshotAgeMs,
    designations: Object.freeze(designations), excludedChannelIds: Object.freeze(excluded) });
}
export function normalizePremiumPermissionGraph(input: PremiumPermissionGraph): PremiumPermissionGraph {
  premiumSnowflake(input.guildId); premiumUtc(input.observedAtUtc); premiumSnowflake(input.bot.userId);
  if (!Array.isArray(input.roles) || input.roles.length > 250 || !Array.isArray(input.channels) || input.channels.length > 500
    || !Array.isArray(input.bot.roleIds) || input.bot.roleIds.length > 250) throw new PlatformPremiumError("invalid");
  const roleIds = new Set<string>(); const channelIds = new Set<string>();
  const roles = input.roles.map(r => {
    premiumSnowflake(r.id); premiumInteger(r.position, 0, 1000); premiumPermissionBits(r.permissions);
    if (roleIds.has(r.id) || typeof r.managed !== "boolean") throw new PlatformPremiumError("invalid"); roleIds.add(r.id);
    return Object.freeze({ id: r.id, position: r.position, permissions: r.permissions, managed: r.managed });
  }).sort(compareId);
  const channels = input.channels.map(c => {
    premiumSnowflake(c.id); if (c.parentId !== null) premiumSnowflake(c.parentId); premiumInteger(c.type, 0, 100);
    if (c.guildId !== input.guildId || channelIds.has(c.id) || !Array.isArray(c.overwrites) || c.overwrites.length > 1000) {
      throw new PlatformPremiumError("invalid");
    }
    channelIds.add(c.id); const values = ordered(c.overwrites);
    if (new Set(values.map(o => `${o.type}:${o.id}`)).size !== values.length) throw new PlatformPremiumError("invalid");
    return Object.freeze({ id: c.id, guildId: c.guildId, type: c.type, parentId: c.parentId, overwrites: values });
  }).sort(compareId);
  const botRoles = [...new Set(input.bot.roleIds.map(premiumSnowflake))].sort();
  // Native member role IDs exclude @everyone; aggregating its overwrite again
  // after the everyone layer would incorrectly undo another role's deny.
  if (botRoles.some(id => id === input.guildId || !roleIds.has(id))) throw new PlatformPremiumError("invalid");
  return Object.freeze({ guildId: input.guildId, observedAtUtc: input.observedAtUtc, roles: Object.freeze(roles),
    channels: Object.freeze(channels), bot: Object.freeze({ userId: input.bot.userId, roleIds: Object.freeze(botRoles) }) });
}
function applyEveryone(base: bigint, channel: PremiumPermissionChannel, guildId: string): bigint {
  const e = channel.overwrites.find(o => o.type === 0 && o.id === guildId);
  return e ? (base & ~BigInt(e.deny)) | BigInt(e.allow) : base;
}
function roleFlags(base: bigint, value: PremiumChannelOverwrite | null): bigint {
  return value ? (base & ~BigInt(value.deny)) | BigInt(value.allow) : base;
}
function botFlags(graph: PremiumPermissionGraph, channel: PremiumPermissionChannel, everyone: bigint): bigint {
  let permissions = everyone;
  for (const r of graph.roles) if (graph.bot.roleIds.includes(r.id)) permissions |= BigInt(r.permissions);
  if (permissions & ADMIN) return permissions;
  permissions = applyEveryone(permissions, channel, graph.guildId);
  let allow = BigInt(0); let deny = BigInt(0);
  for (const o of channel.overwrites) if (o.type === 0 && graph.bot.roleIds.includes(o.id)) { allow |= BigInt(o.allow); deny |= BigInt(o.deny); }
  permissions = (permissions & ~deny) | allow;
  return roleFlags(permissions, channel.overwrites.find(o => o.type === 1 && o.id === graph.bot.userId) ?? null);
}

/** Pure metadata planner. It never treats a category as a second overwrite layer:
 * children carry their own current permissions; synced-category changes propagate
 * natively. No DB, request authority, role membership or I/O is involved. */
export function planPremiumChannelPermissions(raw: PremiumPermissionGraph, rawPolicy: PremiumPermissionPolicy,
  nowUtc: string): PremiumChannelPermissionPlan {
  const graph = normalizePremiumPermissionGraph(raw); const policy = normalizePremiumPermissionPolicy(rawPolicy);
  const at = premiumUtc(nowUtc); const until = new Date(Date.parse(graph.observedAtUtc) + policy.maximumSnapshotAgeMs).toISOString();
  if (graph.guildId !== policy.guildId || graph.bot.userId !== policy.botUserId
    || graph.observedAtUtc > at || until <= at) throw new PlatformPremiumError("invalid");
  const roles = new Map(graph.roles.map(r => [r.id, r])); const channels = new Map(graph.channels.map(c => [c.id, c]));
  const everyoneRole = roles.get(policy.guildId); const source = roles.get(policy.sourceRoleId); const target = roles.get(policy.complimentaryRoleId);
  const global: PremiumPermissionIssue[] = [];
  if (!everyoneRole || !source || !target || source.managed || target.managed || BigInt(target.permissions) !== BigInt(0)) global.push("role_invalid");
  const E = everyoneRole ? BigInt(everyoneRole.permissions) : BigInt(0); const P = source ? BigInt(source.permissions) : BigInt(0);
  if ((E & ADMIN) || (P & PRIVILEGED) || ((P & ~E) & ~(SAFE | KNOWN_NON_TEXT))) global.push("source_privileged");
  const approved = new Set(policy.designations.map(d => d.channelId)); const unreviewed: string[] = [];
  for (const c of graph.channels) {
    if (approved.has(c.id)) continue;
    const paid = c.overwrites.find(o => o.type === 0 && o.id === policy.sourceRoleId);
    const complimentary = c.overwrites.find(o => o.type === 0 && o.id === policy.complimentaryRoleId);
    const paidOnlyVisibility = (roleFlags(applyEveryone(E | P, c, policy.guildId), paid ?? null) & VIEW)
      && !(applyEveryone(E, c, policy.guildId) & VIEW);
    if (paidOnlyVisibility || (paid && (BigInt(paid.allow) & VIEW))) {
      if (policy.excludedChannelIds.includes(c.id)) global.push("channel_excluded");
      else { unreviewed.push(c.id); global.push("unreviewed_source_access"); }
    }
    if (complimentary && BigInt(complimentary.allow) !== BigInt(0)) {
      unreviewed.push(c.id); global.push("unreviewed_complimentary_access");
    }
  }
  const highestBot = graph.roles.filter(r => graph.bot.roleIds.includes(r.id)).reduce((value, r) => Math.max(value, r.position), -1);
  const rows = policy.designations.map(d => {
    const c = channels.get(d.channelId); const issues: PremiumPermissionIssue[] = [];
    let before: PremiumChannelOverwrite | null = null; let desired: PremiumChannelOverwrite | null = null;
    let sourceFlags: bigint | null = null; let desiredFlags: bigint | null = null; let extra: bigint | null = null;
    let currentExtra: bigint | null = null; let currentMissing: bigint | null = null; let synced = false; let capable = false;
    if (!c) issues.push("channel_missing");
    else {
      if (policy.excludedChannelIds.includes(c.id)) issues.push("channel_excluded");
      if (![0, 5].includes(c.type)) issues.push("channel_type");
      if (c.parentId !== d.parentId) issues.push("parent_changed");
      const parent = c.parentId === null ? undefined : channels.get(c.parentId);
      if (c.parentId !== null && (!parent || parent.type !== 4)) issues.push("parent_changed");
      synced = Boolean(parent && JSON.stringify(c.overwrites) === JSON.stringify(parent.overwrites));
      before = c.overwrites.find(o => o.type === 0 && o.id === policy.complimentaryRoleId) ?? null;
      const paid = c.overwrites.find(o => o.type === 0 && o.id === policy.sourceRoleId) ?? null;
      const sourceBase = applyEveryone(E | P, c, policy.guildId); const targetBase = applyEveryone(E, c, policy.guildId);
      sourceFlags = roleFlags(sourceBase, paid) & SAFE;
      const sourceAllow = paid ? BigInt(paid.allow) : BigInt(0); const sourceDeny = paid ? BigInt(paid.deny) : BigInt(0);
      extra = (sourceBase & ~targetBase) & ~sourceDeny & SAFE;
      if (sourceAllow & ~SAFE) issues.push("source_permission_unsupported");
      if (d.kind === "hide") {
        if (sourceFlags & VIEW) issues.push("hide_source_visible");
        if (c.overwrites.some(o => o.id !== policy.guildId && o.id !== policy.sourceRoleId
          && o.id !== policy.complimentaryRoleId && (BigInt(o.allow) & VIEW)
          && (o.type === 1 || !(BigInt(roles.get(o.id)?.permissions ?? "0") & ADMIN)))) issues.push("hide_allow_conflict");
        desired = Object.freeze({ id: policy.complimentaryRoleId, type: 0 as const, allow: "0", deny: VIEW.toString() });
      } else {
        // A guild-derived bit converted into an explicit role allow would defeat
        // another role's deny. Hold that case rather than claim universal parity.
        if (c.overwrites.some(o => o.type === 0 && ![policy.guildId, policy.sourceRoleId, policy.complimentaryRoleId].includes(o.id)
          && !(BigInt(roles.get(o.id)?.permissions ?? "0") & ADMIN) && (extra! & BigInt(o.deny) & ~BigInt(o.allow)))) {
          issues.push("other_role_deny_conflict");
        }
        desired = Object.freeze({ id: policy.complimentaryRoleId, type: 0 as const,
          allow: ((sourceAllow & SAFE) | extra).toString(), deny: sourceDeny.toString() });
        if (before === null && desired.allow === "0" && desired.deny === "0") desired = null;
      }
      desiredFlags = roleFlags(targetBase, desired) & (d.kind === "hide" ? VIEW : SAFE);
      if (d.kind === "hide") sourceFlags &= VIEW;
      const current = roleFlags(targetBase, before) & (d.kind === "hide" ? VIEW : SAFE);
      currentExtra = current & ~sourceFlags; currentMissing = sourceFlags & ~current;
      if (d.kind === "ordinary" && desiredFlags !== sourceFlags) issues.push("source_permission_unsupported");
      if (synced && !d.allowCategoryUnsync && !samePremiumChannelOverwrite(before, desired)) issues.push("category_sync_review");
      const actor = botFlags(graph, c, E);
      const explicitManager = c.overwrites.some(o => ((o.type === 1 && o.id === graph.bot.userId)
        || (o.type === 0 && graph.bot.roleIds.includes(o.id))) && Boolean(BigInt(o.allow) & MANAGE_ROLES));
      let guildBot = E; for (const r of graph.roles) if (graph.bot.roleIds.includes(r.id)) guildBot |= BigInt(r.permissions);
      const parentBot = parent ? botFlags(graph, parent, E) : guildBot;
      const required = desired ? BigInt(desired.allow) | BigInt(desired.deny) : BigInt(0);
      capable = Boolean(target && highestBot > target.position && (actor & (MANAGE_ROLES | ADMIN))
        && (actor & (VIEW | ADMIN)) && ((guildBot & ADMIN) || explicitManager || !(required & ~(guildBot | parentBot))));
    }
    const state = issues.length || global.length ? "review" as const : samePremiumChannelOverwrite(before, desired) ? "same" as const : "change" as const;
    return Object.freeze({ channelId: d.channelId, kind: d.kind, before, desired, state,
      issues: Object.freeze([...new Set(issues)]), sourceChannelFlags: sourceFlags?.toString() ?? null,
      desiredChannelFlags: desiredFlags?.toString() ?? null, currentExtraFlags: currentExtra?.toString() ?? null,
      currentMissingFlags: currentMissing?.toString() ?? null, guildExtraFlags: extra?.toString() ?? null,
      categorySynced: synced, actorCanWrite: capable });
  });
  // Ignore only the managed target overwrite for the structural guard; each row
  // still compares its exact target preimage separately before a write.
  const guard = { roles: graph.roles, bot: graph.bot, channels: graph.channels.map(c => ({ ...c,
    overwrites: c.overwrites.filter(o => !(o.type === 0 && o.id === policy.complimentaryRoleId)) })) };
  return Object.freeze({ kind: "read_only_permission_plan", canApply: false, policy,
    policyDigest: premiumPermissionDigest(policy), guardDigest: premiumPermissionDigest(guard),
    diffDigest: premiumPermissionDigest({ rows: rows.map(r => ({ channelId: r.channelId, before: r.before, desired: r.desired })),
      issues: [...new Set(global)] }),
    observedAtUtc: graph.observedAtUtc, validUntilUtc: until, rows: Object.freeze(rows),
    globalIssues: Object.freeze([...new Set(global)]), unreviewedChannelIds: Object.freeze([...new Set(unreviewed)].sort()) });
}
