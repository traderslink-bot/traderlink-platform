import { randomUUID } from "node:crypto";
import { mkdirSync } from "node:fs";
import { homedir } from "node:os";
import { dirname, isAbsolute, join, resolve } from "node:path";

import Database from "better-sqlite3";

export const TRADE_TAG_NAME_MAXIMUM = 40;
export const TRADE_TAG_OWNER_MAXIMUM = 200;
export const TRADE_TAGS_PER_TRADE_MAXIMUM = 10;

export const PRESET_TRADE_TAG_NAMES = Object.freeze([
  "A+ setup",
  "Gap and go",
  "Opening range breakout",
  "First pullback",
  "Breakout",
  "VWAP reclaim",
  "Red to green",
  "Failed breakout",
  "Parabolic short",
  "Bounce",
  "Patient entry",
  "Early entry",
  "Late entry",
  "Chased",
  "Good risk control",
  "Oversized",
  "Clean exit",
  "Held too long",
  "Cut loss",
  "Added to winner",
  "Added to loser",
] as const);

export type TradeTagOwnerScope = Readonly<{
  userId: string;
  workspaceId: string;
}>;

export type TradeTagDefinition = Readonly<{
  contractVersion: "ti_v3_trade_tag_definition_v1";
  tagId: string;
  name: string;
  createdAt: string;
  updatedAt: string;
  revision: string;
  assignmentCount: number;
}>;

type TagRow = {
  tag_id: string;
  name: string;
  created_at: string;
  updated_at: string;
  revision: string;
  assignment_count: number;
};

function timestamp(): string {
  return new Date().toISOString().replace(/Z$/, "000000Z");
}

export function normalizeTradeTagName(input: unknown): {
  name: string;
  normalizedName: string;
} {
  if (typeof input !== "string") throw new Error("ti_v3_trade_tag_invalid_name");
  const name = input.trim().replace(/\s+/g, " ");
  if (
    !name ||
    name.length > TRADE_TAG_NAME_MAXIMUM ||
    /[\u0000-\u001f\u007f]/.test(name)
  ) {
    throw new Error("ti_v3_trade_tag_invalid_name");
  }
  return { name, normalizedName: name.toLocaleLowerCase("en-US") };
}

export function resolveTradeTagDatabasePath(
  environment: NodeJS.ProcessEnv = process.env,
): string {
  const configured = environment.TRADER_INTELLIGENCE_JOURNAL_DB_PATH?.trim();
  if (configured) {
    if (!isAbsolute(configured)) {
      throw new Error("ti_v3_trade_tag_database_path_must_be_absolute");
    }
    return resolve(configured);
  }
  const privateRoot =
    environment.LOCALAPPDATA?.trim() ||
    environment.APPDATA?.trim() ||
    join(homedir(), ".traderlink");
  return join(privateRoot, "TraderLink", "trade-journal-v1.sqlite");
}

function record(row: TagRow): TradeTagDefinition {
  return Object.freeze({
    contractVersion: "ti_v3_trade_tag_definition_v1",
    tagId: row.tag_id,
    name: row.name,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    revision: row.revision,
    assignmentCount: Number(row.assignment_count),
  });
}

export class SqliteTradeTagRepository {
  readonly #database: Database.Database;

  constructor(databasePath = resolveTradeTagDatabasePath()) {
    if (databasePath !== ":memory:") mkdirSync(dirname(databasePath), { recursive: true });
    this.#database = new Database(databasePath);
    this.#database.pragma("journal_mode = WAL");
    this.#database.pragma("foreign_keys = ON");
    this.#database.exec(`
      CREATE TABLE IF NOT EXISTS ti_v3_trade_tags (
        tag_id TEXT PRIMARY KEY,
        user_id TEXT NOT NULL,
        workspace_id TEXT NOT NULL,
        name TEXT NOT NULL,
        normalized_name TEXT NOT NULL,
        revision TEXT NOT NULL,
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL,
        UNIQUE (user_id, workspace_id, normalized_name)
      );
      CREATE TABLE IF NOT EXISTS ti_v3_trade_tag_assignments (
        tag_id TEXT NOT NULL REFERENCES ti_v3_trade_tags(tag_id) ON DELETE CASCADE,
        user_id TEXT NOT NULL,
        workspace_id TEXT NOT NULL,
        canonical_account_key TEXT NOT NULL,
        semantic_round_trip_key TEXT NOT NULL,
        session_date TEXT NOT NULL,
        created_at TEXT NOT NULL,
        PRIMARY KEY (
          user_id, workspace_id, canonical_account_key,
          semantic_round_trip_key, tag_id
        )
      );
      CREATE TABLE IF NOT EXISTS ti_v3_trade_tag_seed_state (
        user_id TEXT NOT NULL,
        workspace_id TEXT NOT NULL,
        seed_version TEXT NOT NULL,
        seeded_at TEXT NOT NULL,
        PRIMARY KEY (user_id, workspace_id)
      );
      CREATE INDEX IF NOT EXISTS ti_v3_trade_tags_owner
        ON ti_v3_trade_tags (user_id, workspace_id, normalized_name);
      CREATE INDEX IF NOT EXISTS ti_v3_trade_tag_assignments_trade
        ON ti_v3_trade_tag_assignments (
          user_id, workspace_id, semantic_round_trip_key
        );
    `);
  }

  close(): void {
    this.#database.close();
  }

  list(owner: TradeTagOwnerScope): readonly TradeTagDefinition[] {
    this.#seedPresets(owner);
    const rows = this.#database.prepare(`
      SELECT t.tag_id, t.name, t.created_at, t.updated_at, t.revision,
             COUNT(a.tag_id) AS assignment_count
      FROM ti_v3_trade_tags t
      LEFT JOIN ti_v3_trade_tag_assignments a ON a.tag_id = t.tag_id
      WHERE t.user_id = ? AND t.workspace_id = ?
      GROUP BY t.tag_id
      ORDER BY t.normalized_name, t.tag_id
    `).all(owner.userId, owner.workspaceId) as TagRow[];
    return Object.freeze(rows.map(record));
  }

  #seedPresets(owner: TradeTagOwnerScope): void {
    const seeded = this.#database.prepare(`
      SELECT seed_version
      FROM ti_v3_trade_tag_seed_state
      WHERE user_id = ? AND workspace_id = ?
    `).get(owner.userId, owner.workspaceId) as { seed_version: string } | undefined;
    if (seeded) return;

    const now = timestamp();
    this.#database.transaction(() => {
      const insert = this.#database.prepare(`
        INSERT OR IGNORE INTO ti_v3_trade_tags (
          tag_id, user_id, workspace_id, name, normalized_name,
          revision, created_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `);
      for (const presetName of PRESET_TRADE_TAG_NAMES) {
        const { name, normalizedName } = normalizeTradeTagName(presetName);
        insert.run(
          `trade-tag-${randomUUID()}`,
          owner.userId,
          owner.workspaceId,
          name,
          normalizedName,
          randomUUID(),
          now,
          now,
        );
      }
      this.#database.prepare(`
        INSERT INTO ti_v3_trade_tag_seed_state (
          user_id, workspace_id, seed_version, seeded_at
        ) VALUES (?, ?, 'v1', ?)
      `).run(owner.userId, owner.workspaceId, now);
    })();
  }

  create(owner: TradeTagOwnerScope, rawName: unknown): TradeTagDefinition {
    const { name, normalizedName } = normalizeTradeTagName(rawName);
    if (this.list(owner).length >= TRADE_TAG_OWNER_MAXIMUM) {
      throw new Error("ti_v3_trade_tag_owner_limit");
    }
    const now = timestamp();
    const tagId = `trade-tag-${randomUUID()}`;
    const revision = randomUUID();
    try {
      this.#database.prepare(`
        INSERT INTO ti_v3_trade_tags (
          tag_id, user_id, workspace_id, name, normalized_name,
          revision, created_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `).run(tagId, owner.userId, owner.workspaceId, name, normalizedName,
        revision, now, now);
    } catch (error) {
      if (String(error).includes("UNIQUE")) {
        throw new Error("ti_v3_trade_tag_duplicate_name");
      }
      throw error;
    }
    return this.list(owner).find((tag) => tag.tagId === tagId)!;
  }

  rename(
    owner: TradeTagOwnerScope,
    tagId: string,
    rawName: unknown,
    expectedRevision: unknown,
  ): TradeTagDefinition {
    const { name, normalizedName } = normalizeTradeTagName(rawName);
    if (typeof expectedRevision !== "string" || !expectedRevision) {
      throw new Error("ti_v3_trade_tag_revision_conflict");
    }
    const nextRevision = randomUUID();
    try {
      const result = this.#database.prepare(`
        UPDATE ti_v3_trade_tags
        SET name = ?, normalized_name = ?, revision = ?, updated_at = ?
        WHERE tag_id = ? AND user_id = ? AND workspace_id = ? AND revision = ?
      `).run(name, normalizedName, nextRevision, timestamp(), tagId,
        owner.userId, owner.workspaceId, expectedRevision);
      if (result.changes !== 1) throw new Error("ti_v3_trade_tag_revision_conflict");
    } catch (error) {
      if (String(error).includes("UNIQUE")) {
        throw new Error("ti_v3_trade_tag_duplicate_name");
      }
      throw error;
    }
    return this.list(owner).find((tag) => tag.tagId === tagId)!;
  }

  delete(
    owner: TradeTagOwnerScope,
    tagId: string,
    expectedRevision: unknown,
    confirmAssignedDeletion: boolean,
  ): number {
    const tag = this.list(owner).find((candidate) => candidate.tagId === tagId);
    if (!tag || tag.revision !== expectedRevision) {
      throw new Error("ti_v3_trade_tag_revision_conflict");
    }
    if (tag.assignmentCount > 0 && !confirmAssignedDeletion) {
      throw new Error(`ti_v3_trade_tag_assigned:${tag.assignmentCount}`);
    }
    const result = this.#database.prepare(`
      DELETE FROM ti_v3_trade_tags
      WHERE tag_id = ? AND user_id = ? AND workspace_id = ? AND revision = ?
    `).run(tagId, owner.userId, owner.workspaceId, expectedRevision);
    if (result.changes !== 1) throw new Error("ti_v3_trade_tag_revision_conflict");
    return tag.assignmentCount;
  }

  listForTrades(
    owner: TradeTagOwnerScope,
    roundTripKeys: readonly string[],
  ): Readonly<Record<string, readonly TradeTagDefinition[]>> {
    const output: Record<string, TradeTagDefinition[]> = Object.fromEntries(
      roundTripKeys.map((key) => [key, []]),
    );
    if (roundTripKeys.length === 0) return output;
    const placeholders = roundTripKeys.map(() => "?").join(",");
    const rows = this.#database.prepare(`
      SELECT a.semantic_round_trip_key, t.tag_id, t.name, t.created_at,
             t.updated_at, t.revision,
             (SELECT COUNT(*) FROM ti_v3_trade_tag_assignments c
              WHERE c.tag_id = t.tag_id) AS assignment_count
      FROM ti_v3_trade_tag_assignments a
      JOIN ti_v3_trade_tags t ON t.tag_id = a.tag_id
      WHERE a.user_id = ? AND a.workspace_id = ?
        AND a.semantic_round_trip_key IN (${placeholders})
      ORDER BY t.normalized_name, t.tag_id
    `).all(owner.userId, owner.workspaceId, ...roundTripKeys) as
      (TagRow & { semantic_round_trip_key: string })[];
    for (const row of rows) output[row.semantic_round_trip_key]?.push(record(row));
    return Object.freeze(output);
  }

  replaceForTrade(input: {
    owner: TradeTagOwnerScope;
    canonicalAccountKey: string;
    semanticRoundTripKey: string;
    sessionDate: string;
    tagIds: readonly string[];
  }): readonly TradeTagDefinition[] {
    const uniqueTagIds = [...new Set(input.tagIds)];
    if (uniqueTagIds.length > TRADE_TAGS_PER_TRADE_MAXIMUM) {
      throw new Error("ti_v3_trade_tag_trade_limit");
    }
    const available = new Map(this.list(input.owner).map((tag) => [tag.tagId, tag]));
    if (uniqueTagIds.some((tagId) => !available.has(tagId))) {
      throw new Error("ti_v3_trade_tag_unavailable");
    }
    this.#database.transaction(() => {
      this.#database.prepare(`
        DELETE FROM ti_v3_trade_tag_assignments
        WHERE user_id = ? AND workspace_id = ? AND canonical_account_key = ?
          AND semantic_round_trip_key = ?
      `).run(input.owner.userId, input.owner.workspaceId,
        input.canonicalAccountKey, input.semanticRoundTripKey);
      const insert = this.#database.prepare(`
        INSERT INTO ti_v3_trade_tag_assignments (
          tag_id, user_id, workspace_id, canonical_account_key,
          semantic_round_trip_key, session_date, created_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?)
      `);
      for (const tagId of uniqueTagIds) {
        insert.run(tagId, input.owner.userId, input.owner.workspaceId,
          input.canonicalAccountKey, input.semanticRoundTripKey,
          input.sessionDate, timestamp());
      }
    })();
    return uniqueTagIds.map((tagId) => available.get(tagId)!);
  }
}
