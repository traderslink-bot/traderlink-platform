import "server-only";
import { createHash, randomUUID } from "node:crypto";
import { mkdir, open, readdir, rename, stat, unlink } from "node:fs/promises";
import { dirname, join } from "node:path";
import { resolvePlatformDatabaseConfig } from "@/src/modules/platform/server/database/platform-database-config";
import { INITIAL_WATCHLIST_SETUP_KINDS } from "@/src/lib/live-watchlist/setups/setup-contracts";
import type { SetupConfiguration } from "@/src/lib/live-watchlist/setups/setup-contracts";
import type { WatchlistSetupEvaluation } from "@/src/lib/live-watchlist/setups/setup-engine";
import type { WatchlistSetupInput } from "@/src/lib/live-watchlist/setups/setup-input";

export const savedSetupPublicationIdentity = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/iu;
export type { SetupConfiguration } from "@/src/lib/live-watchlist/setups/setup-contracts";
export type SetupSavedRecord = Readonly<{
  version: 1; configurationRevision: number; input: WatchlistSetupInput; evaluation: WatchlistSetupEvaluation;
}>;
const MAX_FILE_BYTES = 4_000_000;
const MAX_DIRECTORY_BYTES = 100_000_000;
const MAX_FILES = 5000;
const CONTROL_RESERVE_BYTES = 4_000_000;
const CONTROL_RESERVE_FILES = 16;
const managedName = /^(?:settings\.json|(?:evidence|latest|settings)-[a-f0-9]{64}\.json)$/u;
const rotatingName = /^(?:evidence|settings)-[a-f0-9]{64}\.json$/u;
const defaults = (): SetupConfiguration => ({ version: 1, revision: 0,
  settings: { enabled: false, enabledDetectors: [...INITIAL_WATCHLIST_SETUP_KINDS],
    sessions: ["premarket", "regular", "postmarket"], showMemberCard: true, notifyForming: false, notifyConfirmed: false },
  tickerOverrides: {} });
const digest = (value: string) => createHash("sha256").update(value).digest("hex");

export function parseSetupConfiguration(value: unknown): SetupConfiguration {
  if (!value || typeof value !== "object") throw Error("setup_configuration_invalid");
  const input = value as SetupConfiguration, settings = input.settings;
  if (input.version !== 1 || !Number.isSafeInteger(input.revision) || input.revision < 0 || !settings
    || [settings.enabled, settings.showMemberCard, settings.notifyForming, settings.notifyConfirmed].some(item => typeof item !== "boolean")
    || !Array.isArray(settings.enabledDetectors) || settings.enabledDetectors.length > 4
    || new Set(settings.enabledDetectors).size !== settings.enabledDetectors.length
    || settings.enabledDetectors.some(item => !INITIAL_WATCHLIST_SETUP_KINDS.includes(item))
    || !Array.isArray(settings.sessions) || settings.sessions.length > 3 || new Set(settings.sessions).size !== settings.sessions.length
    || settings.sessions.some(item => !["premarket", "regular", "postmarket"].includes(item))
    || !input.tickerOverrides || Array.isArray(input.tickerOverrides) || typeof input.tickerOverrides !== "object"
    || Object.keys(input.tickerOverrides).length > 256
    || Object.entries(input.tickerOverrides).some(([id, enabled]) => !savedSetupPublicationIdentity.test(id) || typeof enabled !== "boolean")) {
    throw Error("setup_configuration_invalid");
  }
  return { version: 1, revision: input.revision,
    settings: { enabled: settings.enabled, enabledDetectors: [...settings.enabledDetectors], sessions: [...settings.sessions],
      showMemberCard: settings.showMemberCard, notifyForming: settings.notifyForming, notifyConfirmed: settings.notifyConfirmed },
    tickerOverrides: Object.fromEntries(Object.entries(input.tickerOverrides)) };
}

/** One persistent-volume writer. No provider, notification or schema mutation. */
export class WatchlistSetupStore {
  private writes: Promise<unknown> = Promise.resolve();
  private directoryBytes: number | null = null;
  private directoryFiles = 0;
  private failure: "storage_unavailable" | "storage_full" | null = null;
  constructor(private readonly directory: string) {}

  status() { return { failure: this.failure, maxBytes: MAX_DIRECTORY_BYTES, maxFiles: MAX_FILES,
    retention: "oldest_automatic_history_first_latest_preserved", controlReserveBytes: CONTROL_RESERVE_BYTES }; }
  private async json(name: string): Promise<unknown> {
    const file = await open(join(this.directory, name), "r");
    try {
      if ((await file.stat()).size > MAX_FILE_BYTES) throw Error("setup_record_too_large");
      return JSON.parse(await file.readFile("utf8"));
    } finally { await file.close(); }
  }
  async configuration(): Promise<SetupConfiguration> {
    try { return parseSetupConfiguration(await this.json("settings.json")); }
    catch (error) { if ((error as NodeJS.ErrnoException).code === "ENOENT") return defaults(); throw error; }
  }
  private async initialize(): Promise<void> {
    if (this.directoryBytes !== null) return;
    await mkdir(this.directory, { recursive: true, mode: 0o700 });
    const files = (await readdir(this.directory)).filter(name => managedName.test(name));
    let size = 0;
    for (const name of files) {
      size += (await stat(join(this.directory, name))).size;
    }
    this.directoryBytes = size; this.directoryFiles = files.length;
  }
  private async reserve(delta: number, added: number, name: string): Promise<void> {
    const control = name === "settings.json";
    const maxBytes = MAX_DIRECTORY_BYTES - (control ? 0 : CONTROL_RESERVE_BYTES);
    const maxFiles = MAX_FILES - (control ? 0 : CONTROL_RESERVE_FILES);
    if (this.directoryBytes! + delta <= maxBytes && this.directoryFiles + added <= maxFiles) return;
    // Only generated history is rotated. Latest publications, current settings,
    // pinned exports, unrecognized files and symlinks are never eviction targets.
    const candidates = [];
    for (const entry of await readdir(this.directory, { withFileTypes: true })) {
      if (!entry.isFile() || !rotatingName.test(entry.name) || entry.name === name) continue;
      const metadata = await stat(join(this.directory, entry.name));
      candidates.push({ name: entry.name, size: metadata.size, at: metadata.mtimeMs });
    }
    candidates.sort((left, right) => left.at - right.at || left.name.localeCompare(right.name));
    for (const candidate of candidates) {
      if (this.directoryBytes! + delta <= maxBytes * 0.85 && this.directoryFiles + added <= Math.floor(maxFiles * 0.85)) break;
      await unlink(join(this.directory, candidate.name));
      this.directoryBytes! -= candidate.size; this.directoryFiles--;
    }
    if (this.directoryBytes! + delta > maxBytes || this.directoryFiles + added > maxFiles) {
      this.failure = "storage_full"; throw Error("setup_storage_full");
    }
  }
  private async write(name: string, value: unknown, immutable = false): Promise<void> {
    const bytes = Buffer.from(JSON.stringify(value));
    if (bytes.length > MAX_FILE_BYTES) throw Error("setup_record_too_large");
    await this.initialize();
    const target = join(this.directory, name);
    let oldSize = 0;
    try { oldSize = (await stat(target)).size; if (immutable) return; }
    catch (error) { if ((error as NodeJS.ErrnoException).code !== "ENOENT") throw error; }
    await this.reserve(bytes.length - oldSize, oldSize === 0 ? 1 : 0, name);
    const temporary = join(this.directory, `${name}.${randomUUID()}.tmp`);
    const file = await open(temporary, "wx", 0o600);
    try { await file.writeFile(bytes); await file.sync(); } finally { await file.close(); }
    try { await rename(temporary, target); }
    finally { await unlink(temporary).catch(() => {}); }
    this.directoryBytes = this.directoryBytes! - oldSize + bytes.length;
    if (oldSize === 0) this.directoryFiles++;
    this.failure = null;
  }
  private serialize<T>(operation: () => Promise<T>): Promise<T> {
    const result = this.writes.then(operation);
    this.writes = result.catch(error => {
      if ((error as Error).message === "setup_configuration_changed" || (error as Error).message === "setup_configuration_invalid") return;
      if (this.failure !== "storage_full") this.failure = "storage_unavailable";
      this.directoryBytes = null; // Recount after partial I/O rather than trusting stale totals.
    });
    return result;
  }
  saveConfiguration(input: SetupConfiguration, expectedRevision: number): Promise<SetupConfiguration> {
    return this.serialize(async () => {
      const current = await this.configuration();
      if (current.revision !== expectedRevision) throw Error("setup_configuration_changed");
      const next = parseSetupConfiguration({ ...input, revision: current.revision + 1 });
      await this.write("settings.json", next);
      // Control success never depends on the optional immutable history copy.
      try { await this.write(`settings-${digest(JSON.stringify(next))}.json`, next, true); }
      catch {
        if (this.failure !== "storage_full") this.failure = "storage_unavailable";
        this.directoryBytes = null;
      }
      return next;
    });
  }
  async latest(symbol: string, publicationIdentity: string): Promise<SetupSavedRecord | null> {
    if (!savedSetupPublicationIdentity.test(publicationIdentity) || !/^[A-Z][A-Z0-9.-]{0,15}$/u.test(symbol)) return null;
    try {
      const record = await this.json(`latest-${digest(publicationIdentity)}.json`) as SetupSavedRecord;
      if (record.version !== 1 || record.input?.symbol !== symbol || record.input.publicationIdentity !== publicationIdentity
        || record.evaluation?.snapshot?.symbol !== symbol || record.evaluation.snapshot.publicationIdentity !== publicationIdentity) throw Error("setup_record_identity_mismatch");
      return record;
    } catch (error) { if ((error as NodeJS.ErrnoException).code === "ENOENT") return null; throw error; }
  }
  /** Owner-requested results scan. Serial, read-only and bounded by retained storage.
   * Does not initialize storage or prevent the existing writer from continuing. */
  async *resultEvidence(signal?: AbortSignal): AsyncGenerator<{ record?: SetupSavedRecord; unreadable?: true }> {
    let entries;
    try { entries = await readdir(this.directory, { withFileTypes: true }); }
    catch (error) { if ((error as NodeJS.ErrnoException).code === "ENOENT") return; throw error; }
    const names = entries.filter(entry => entry.isFile() && /^(?:evidence|latest)-[a-f0-9]{64}\.json$/u.test(entry.name)).map(entry => entry.name).sort();
    if (names.length > MAX_FILES) throw Error("setup_results_storage_limit");
    let bytes = 0;
    for (const name of names) {
      if (signal?.aborted) throw Error("setup_results_cancelled");
      try {
        bytes += (await stat(join(this.directory, name))).size;
        if (bytes > MAX_DIRECTORY_BYTES) throw Error("setup_results_storage_limit");
        const record = await this.json(name) as SetupSavedRecord;
        if (record.version !== 1 || !savedSetupPublicationIdentity.test(record.input?.publicationIdentity)
          || !/^[A-Z][A-Z0-9.-]{0,15}$/u.test(record.input?.symbol)
          || record.evaluation?.snapshot?.publicationIdentity !== record.input.publicationIdentity
          || record.evaluation.snapshot.symbol !== record.input.symbol) throw Error("setup_results_invalid_record");
        yield { record };
      } catch (error) {
        if ((error as Error).message === "setup_results_storage_limit") throw error;
        yield { unreadable: true };
      }
    }
  }
  save(record: SetupSavedRecord): Promise<void> {
    return this.serialize(async () => {
      const identity = record.input.publicationIdentity;
      if (!savedSetupPublicationIdentity.test(identity)) throw Error("setup_publication_identity_missing");
      const configuration = await this.configuration();
      if (!configuration.settings.enabled || configuration.revision !== record.configurationRevision || configuration.tickerOverrides[identity] === false) return;
      const key = digest(`${identity}:${record.input.revision}:${record.configurationRevision}:${record.evaluation.rulesVersion}`);
      await this.write(`evidence-${key}.json`, record, true);
      await this.write(`latest-${digest(identity)}.json`, record);
    });
  }
}

const shared = globalThis as typeof globalThis & { __watchlistSetupStore?: WatchlistSetupStore };
export function watchlistSetupStore(): WatchlistSetupStore {
  return shared.__watchlistSetupStore ??= new WatchlistSetupStore(join(dirname(resolvePlatformDatabaseConfig().databasePath), "watchlist-setup-evidence"));
}
