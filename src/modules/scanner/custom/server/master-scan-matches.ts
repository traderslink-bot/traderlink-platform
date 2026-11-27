import "server-only";

import { createHash } from "node:crypto";
import { dirname, join } from "node:path";
import { hasScannerDashboardAccess } from "@/src/modules/market-data/server/market-tools-dashboard-access";
import { hasPressReleaseDashboardAccess } from "@/src/modules/news/server/press-release-dashboard-access";
import type { TraderLinkPlatformRequestIdentity } from "@/src/modules/platform/server/authentication/require-platform-request-scope";
import { resolveTraderLinkDiscordGuildId } from "@/src/modules/platform/server/authentication/platform-discord-configuration";
import { PlatformDiscordMembershipRepository } from "@/src/modules/platform/server/authentication/platform-discord-membership-repository";
import { TRADERLINK_PLATFORM_SESSION_TTL_MS } from "@/src/modules/platform/server/authentication/platform-session-service";
import { isCanonicalUuidV4 } from "@/src/modules/platform/server/database/platform-migration-contract";
import { withReadonlyPlatformDatabase } from "@/src/modules/platform/server/database/open-readonly-platform-database";
import { resolvePlatformDatabaseConfig } from "@/src/modules/platform/server/database/platform-database-config";
import { livePresetChoices } from "../built-in-scans";
import { SAVED_SCAN_ID } from "../definition";
import { readSavedScanSourceVersions, savedCustomScansDirectory } from "../saved";
import { readSharedScanSource } from "./shared-scan-store";
import { openLiveScannerMatchFeed, recheckMasterMatchFacts, sampleMasterScanMatches } from "./master-scan-match-evaluation";
import { masterScanStreamKey, MasterScanMatchStore, type MasterScanFacts, type MatchFact } from "./master-scan-match-store";
import { scannerSettingsStore } from "../../live/server/runtime";
import type {
  MasterScanAccess, MasterScanEvaluation, MasterScanMatch, MasterScanOffer, MasterScanRecipient,
  MasterScanSelection, MasterScanSource, ResolvedMasterScan,
} from "./master-scan-match-types";

export type {
  MasterScanAccess, MasterScanEvaluation, MasterScanMatch, MasterScanOffer, MasterScanRecipient,
  MasterScanSelection, MasterScanSource,
} from "./master-scan-match-types";

type Sample = (identity: TraderLinkPlatformRequestIdentity) => Promise<MasterScanFacts | null>;
type Dependencies = {
  directory: string;
  savedDirectory: string;
  now: () => number;
  readIdentity(recipient: MasterScanRecipient): TraderLinkPlatformRequestIdentity | null;
  allowScanner(identity: TraderLinkPlatformRequestIdentity): boolean;
  allowNews(identity: TraderLinkPlatformRequestIdentity): boolean;
  cachedEvidence(identity: TraderLinkPlatformRequestIdentity, fact: MatchFact): boolean;
  verifyEvidence(identity: TraderLinkPlatformRequestIdentity, fact: MatchFact): Promise<boolean>;
  presetRevision(): number;
  open(source: ResolvedMasterScan, changed: () => void): { close(): void; sample: Sample };
};
const denied = { state: "access-lost" as const };
const masterPresetId = (key: string) => "builtin:" + key;
const presetOffers = livePresetChoices.map(({ id, label }) => ({ preset: id.slice(5), label }));
const presetVersion = (revision: number) => `master-1:${revision}`;
const publicationVersion = (id: string) => `publication-1:${createHash("sha256").update(id).digest("hex")}`;

function publicOffer(value: ResolvedMasterScan | null): MasterScanOffer | null {
  return value && { source: value.source, title: value.title };
}

export function createMasterScannerMatches(dependencies: Dependencies) {
  const store = new MasterScanMatchStore(dependencies.directory, dependencies.now);
  const watchers = new Map<string, { close: () => void; listeners: Set<(event: MasterScanEvaluation) => void> }>();

  function actor(recipient: MasterScanRecipient) {
    const identity = dependencies.readIdentity(recipient);
    return identity && identity.scope.userId === recipient.userId && identity.scope.workspaceId === recipient.workspaceId &&
      dependencies.allowScanner(identity) ? identity : null;
  }

  function presetOffer(id: string): ResolvedMasterScan | null {
    const preset = presetOffers.find(item => item.preset === id);
    if (!preset) return null;
    const revision = dependencies.presetRevision();
    return { kind: "preset", preset: id, configurationRevision: revision, title: preset.label,
      source: { kind: "scan", scanId: masterPresetId(id), version: presetVersion(revision) } };
  }

  function offer(identity: TraderLinkPlatformRequestIdentity, selection: MasterScanSelection): ResolvedMasterScan | null {
    if (selection.kind === "preset") {
      const id = selection.id.replace(/^(?:builtin:|live:)/u, "");
      return presetOffer(id);
    }
    if (selection.kind === "saved" && SAVED_SCAN_ID.test(selection.id)) {
      const found = readSavedScanSourceVersions(dependencies.savedDirectory, identity.scope.userId)
        .find(({ scan }) => scan.id === selection.id);
      return found ? { kind: "saved", title: found.scan.name, definition: found.scan.definition,
        source: { kind: "scan", scanId: "saved:" + found.scan.id, version: found.revision } } : null;
    }
    if (selection.kind !== "shared") return null;
    const found = readSharedScanSource(dependencies.savedDirectory, selection.id);
    return found ? { kind: "shared", title: found.scan.name, definition: found.scan.definition,
      source: { kind: "scan", scanId: `shared:${found.ownerKey}:${found.scan.id}`, version: publicationVersion(found.grant.id) } } : null;
  }

  function selectionFor(recipient: MasterScanRecipient, source: MasterScanSource): MasterScanSelection | null {
    if (source.kind !== "scan" || typeof source.scanId !== "string" || typeof source.version !== "string") return null;
    if (source.scanId.startsWith("builtin:")) return { kind: "preset", id: source.scanId.slice(8) };
    if (source.scanId.startsWith("saved:")) return { kind: "saved", id: source.scanId.slice(6) };
    if (source.scanId.startsWith("shared:")) {
      const grantId = store.readShareAdmission(recipient, source);
      return grantId ? { kind: "shared", id: grantId } : null;
    }
    return null;
  }

  function current(recipient: MasterScanRecipient, source: MasterScanSource) {
    const identity = actor(recipient);
    const selection = identity && selectionFor(recipient, source);
    const resolved = identity && selection && offer(identity, selection);
    if (!identity || !resolved || resolved.source.scanId !== source.scanId) return denied;
    if (resolved.source.version !== source.version) return { state: "review-required" as const };
    return { state: "allowed" as const, identity, resolved };
  }

  function resolveMasterScanSource(recipient: MasterScanRecipient, selection: MasterScanSelection): MasterScanOffer | null {
    const identity = actor(recipient);
    const resolved = identity && offer(identity, selection);
    if (resolved && selection.kind === "shared") store.admitShare(recipient, resolved.source, selection.id);
    return publicOffer(resolved);
  }

  function listMasterScanSources(recipient: MasterScanRecipient): readonly MasterScanOffer[] {
    const identity = actor(recipient);
    if (!identity) return [];
    const presets = presetOffers.flatMap(({ preset }) => publicOffer(offer(identity, { kind: "preset", id: preset })) ?? []);
    const saved = readSavedScanSourceVersions(dependencies.savedDirectory, identity.scope.userId)
      .map(({ scan, revision }) => ({ title: scan.name, source: { kind: "scan" as const, scanId: "saved:" + scan.id, version: revision } }));
    const shares = store.listShareAdmissions(recipient)
      .flatMap(id => publicOffer(offer(identity, { kind: "shared", id })) ?? []);
    return [...presets, ...saved, ...shares];
  }

  function readMasterScanMatches(recipient: MasterScanRecipient, source: MasterScanSource, after = 0, limit = 32) {
    if (!Number.isSafeInteger(after) || after < 0 || !Number.isSafeInteger(limit) || limit < 1 || limit > 128) throw RangeError("Invalid match cursor");
    const result = current(recipient, source);
    return result.state === "allowed" ? { state: "allowed" as const, ...store.read(recipient, source, after, limit) }
      : { state: result.state, continuity: "gap" as const, events: [], latest: null };
  }

  function evidence(recipient: MasterScanRecipient, source: MasterScanSource, match: MasterScanMatch) {
    const access = current(recipient, source);
    if (access.state !== "allowed") return null;
    const fact = store.evidence(recipient, source, match);
    if (!fact || (fact.newsId && !dependencies.allowNews(access.identity)) ||
        !dependencies.cachedEvidence(access.identity, fact)) return null;
    return { identity: access.identity, fact };
  }

  function readMasterScanMatchEvidence(recipient: MasterScanRecipient, source: MasterScanSource, match: MasterScanMatch) {
    const read = evidence(recipient, source, match);
    return read ? { symbol: read.fact.symbol, reasonCodes: read.fact.reasonCodes,
      ...(read.fact.companyPin ? { companyEvidence: { revision: read.fact.companyPin.revision,
        asOf: read.fact.companyPin.asOf, accessions: [...new Set(read.fact.companyPin.fields.flatMap(f => f.accessions))] } } : {}) } : null;
  }

  async function verifyMasterScanMatchEvidence(recipient: MasterScanRecipient, source: MasterScanSource, match: MasterScanMatch) {
    const read = evidence(recipient, source, match);
    if (!read || !await dependencies.verifyEvidence(read.identity, read.fact)) return null;
    return readMasterScanMatchEvidence(recipient, source, match);
  }

  async function publish(recipient: MasterScanRecipient, source: MasterScanSource, sample: Sample, stillOpen: () => boolean) {
    const access = current(recipient, source);
    if (access.state !== "allowed" || !stillOpen()) return null;
    const captured = await sample(access.identity).catch(() => null);
    if (!stillOpen() || current(recipient, source).state !== "allowed") return null;
    if (captured) return store.append(recipient, source, captured);
    const prior = store.read(recipient, source, 0, 1).latest;
    return prior && prior.coverage !== "unavailable" ? store.append(recipient, source, {
      coverage: "unavailable", detectedAtUtc: new Date(dependencies.now()).toISOString(), session: prior.session, matches: [],
    }) : null;
  }

  async function captureMasterScanMatches(recipient: MasterScanRecipient, source: MasterScanSource) {
    const access = current(recipient, source);
    if (access.state !== "allowed") return null;
    const reader = dependencies.open(access.resolved, () => {});
    try { return await publish(recipient, source, reader.sample, () => true); }
    finally { reader.close(); }
  }

  function openMasterScanMatches(recipient: MasterScanRecipient, source: MasterScanSource, listener: (event: MasterScanEvaluation) => void) {
    const access = current(recipient, source);
    if (access.state !== "allowed") return () => {};
    const key = masterScanStreamKey(recipient, source);
    let shared = watchers.get(key);
    if (!shared) {
      let active = true;
      let running = false;
      let pending = false;
      const listeners = new Set<(event: MasterScanEvaluation) => void>();
      const change = () => {
        pending = true;
        if (running || !active) return;
        running = true;
        queueMicrotask(async () => {
          try {
            while (pending && active) {
              pending = false;
              if (current(recipient, source).state !== "allowed") { close(); return; }
              const event = await publish(recipient, source, reader.sample, () => active);
              if (event) for (const notify of listeners) {
                try { notify(event); } catch { /* The durable stream is available for replay. */ }
              }
            }
          } catch {
            // Keep the cursor. A later source update can retry without publishing an exit.
          } finally { running = false; }
        });
      };
      const reader = dependencies.open(access.resolved, change);
      const interval = setInterval(change, 5_000);
      interval.unref();
      const close = () => {
        if (!active) return;
        active = false;
        clearInterval(interval);
        reader.close();
        watchers.delete(key);
      };
      shared = { close, listeners };
      watchers.set(key, shared);
      change();
    }
    const entry = shared;
    entry.listeners.add(listener);
    return () => {
      entry.listeners.delete(listener);
      if (!entry.listeners.size) entry.close();
    };
  }

  return {
    resolveMasterScanSource, listMasterScanSources,
    resolveMasterScanAccess: (recipient: MasterScanRecipient, source: MasterScanSource): MasterScanAccess => current(recipient, source).state,
    openMasterScanMatches, captureMasterScanMatches, readMasterScanMatches, readMasterScanMatchEvidence, verifyMasterScanMatchEvidence,
  };
}

function readBackgroundIdentity(recipient: MasterScanRecipient): TraderLinkPlatformRequestIdentity | null {
  if (!isCanonicalUuidV4(recipient.userId) || !isCanonicalUuidV4(recipient.workspaceId)) return null;
  return withReadonlyPlatformDatabase({}, db => {
    const membership = db.prepare<[string, string], { role: "owner" | "admin" | "member"; display_name: string | null }>(`
      SELECT membership.role, actor.display_name FROM platform_workspace_memberships membership
      JOIN platform_users actor USING(user_id) JOIN platform_workspaces space USING(workspace_id)
      WHERE membership.user_id=? AND membership.workspace_id=? AND membership.status='active'
        AND actor.status='active' AND space.status='active'
        AND EXISTS (SELECT 1 FROM platform_auth_identities identity WHERE identity.user_id=actor.user_id AND identity.status='active')
    `).get(recipient.userId, recipient.workspaceId);
    if (!membership) return null;
    const connected = db.prepare("SELECT 1 FROM platform_auth_identities WHERE user_id=? AND auth_provider='discord' AND status='active'").get(recipient.userId);
    const discord = connected ? new PlatformDiscordMembershipRepository(db).findEffective(recipient.userId,
      resolveTraderLinkDiscordGuildId(process.env), new Date(), TRADERLINK_PLATFORM_SESSION_TTL_MS) : null;
    return { scope: { ...recipient, workspaceRole: membership.role, allowedAccountIds: [], activeAccountId: null },
      displayName: membership.display_name, sessionId: null, mode: "platform_session", discord };
  });
}

let production: ReturnType<typeof createMasterScannerMatches> | undefined;
function runtime() {
  return production ??= createMasterScannerMatches({
    directory: join(dirname(resolvePlatformDatabaseConfig().databasePath), "master-scan-matches-v1"),
    savedDirectory: savedCustomScansDirectory(), now: Date.now, readIdentity: readBackgroundIdentity,
    allowScanner: hasScannerDashboardAccess, allowNews: hasPressReleaseDashboardAccess,
    presetRevision: () => scannerSettingsStore().configurationForAlertRead().revision,
    cachedEvidence: recheckMasterMatchFacts, verifyEvidence: (identity, fact) => recheckMasterMatchFacts(identity, fact, true),
    open: (source, changed) => openLiveScannerMatchFeed(source, changed, sampleMasterScanMatches),
  });
}

export const resolveMasterScanSource: ReturnType<typeof runtime>["resolveMasterScanSource"] = (...args) => runtime().resolveMasterScanSource(...args);
export const listMasterScanSources: ReturnType<typeof runtime>["listMasterScanSources"] = (...args) => runtime().listMasterScanSources(...args);
export const resolveMasterScanAccess: ReturnType<typeof runtime>["resolveMasterScanAccess"] = (...args) => runtime().resolveMasterScanAccess(...args);
export const openMasterScanMatches: ReturnType<typeof runtime>["openMasterScanMatches"] = (...args) => runtime().openMasterScanMatches(...args);
export const captureMasterScanMatches: ReturnType<typeof runtime>["captureMasterScanMatches"] = (...args) => runtime().captureMasterScanMatches(...args);
export const readMasterScanMatches: ReturnType<typeof runtime>["readMasterScanMatches"] = (...args) => runtime().readMasterScanMatches(...args);
export const readMasterScanMatchEvidence: ReturnType<typeof runtime>["readMasterScanMatchEvidence"] = (...args) => runtime().readMasterScanMatchEvidence(...args);
export const verifyMasterScanMatchEvidence: ReturnType<typeof runtime>["verifyMasterScanMatchEvidence"] = (...args) => runtime().verifyMasterScanMatchEvidence(...args);
