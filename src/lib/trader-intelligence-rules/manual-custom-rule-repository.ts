import Database from "better-sqlite3";

import type { ExecutionRuleOwnerScope } from "@/src/lib/trader-intelligence-v3/analytics/rules";

import { resolveTradingRulesDatabasePath } from "./sqlite-execution-rule-repository";

export const MANUAL_CUSTOM_RULE_CATEGORIES = [
  "process",
  "setup",
  "mindset",
  "review",
] as const;

export const MANUAL_CUSTOM_RULE_REVIEW_SCOPES = [
  "day_session",
  "trade",
  "both",
] as const;

export type ManualCustomRuleCategory =
  (typeof MANUAL_CUSTOM_RULE_CATEGORIES)[number];
export type ManualCustomRuleReviewScope =
  (typeof MANUAL_CUSTOM_RULE_REVIEW_SCOPES)[number];
export type ManualCustomRuleStatus = "active" | "paused" | "retired";

export interface ManualCustomRuleRecord {
  readonly ruleId: string;
  readonly title: string;
  readonly statement: string;
  readonly category: ManualCustomRuleCategory;
  readonly reviewScope: ManualCustomRuleReviewScope;
  readonly isFocus: boolean;
  readonly status: ManualCustomRuleStatus;
  readonly versionOrdinal: string;
  readonly effectiveFrom: string;
  readonly createdAt: string;
  readonly updatedAt: string;
}

export interface CreateManualCustomRuleInput {
  readonly ruleId: string;
  readonly owner: ExecutionRuleOwnerScope;
  readonly title: string;
  readonly statement: string;
  readonly category: ManualCustomRuleCategory;
  readonly reviewScope: ManualCustomRuleReviewScope;
  readonly isFocus: boolean;
  readonly effectiveFrom: string;
}

export interface ReviseManualCustomRuleInput
  extends Omit<CreateManualCustomRuleInput, "ruleId"> {
  readonly ruleId: string;
  readonly expectedVersionOrdinal: string;
}

export interface TransitionManualCustomRuleInput {
  readonly ruleId: string;
  readonly owner: ExecutionRuleOwnerScope;
  readonly expectedCurrentStatus: ManualCustomRuleStatus;
  readonly newStatus: ManualCustomRuleStatus;
  readonly effectiveAt: string;
}

type ManualRuleRow = Readonly<{
  rule_id: string;
  title: string;
  statement: string;
  category: ManualCustomRuleCategory;
  review_scope: ManualCustomRuleReviewScope;
  is_focus: number;
  status: ManualCustomRuleStatus;
  version_ordinal: string;
  effective_from: string;
  created_at: string;
  updated_at: string;
}>;

function accountKey(owner: ExecutionRuleOwnerScope): string {
  return owner.tradingAccountId ?? "";
}

function validChoice<T extends readonly string[]>(
  value: string,
  choices: T,
): value is T[number] {
  return choices.includes(value);
}

function requiredText(value: string, field: string, maximum: number): string {
  const normalized = value.trim();
  if (!normalized || normalized.length > maximum || /[\u0000-\u001f\u007f]/.test(normalized)) {
    throw new Error(`ti_v3_manual_rule_invalid_${field}`);
  }
  return normalized;
}

function validTimestamp(value: string, field: string): string {
  if (!/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{9}Z$/.test(value)) {
    throw new Error(`ti_v3_manual_rule_invalid_${field}`);
  }
  return value;
}

function rowToRecord(row: ManualRuleRow): ManualCustomRuleRecord {
  return Object.freeze({
    ruleId: row.rule_id,
    title: row.title,
    statement: row.statement,
    category: row.category,
    reviewScope: row.review_scope,
    isFocus: row.is_focus === 1,
    status: row.status,
    versionOrdinal: row.version_ordinal,
    effectiveFrom: row.effective_from,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  });
}

export class SqliteManualCustomRuleRepository {
  readonly #database: Database.Database;

  constructor(databasePath = resolveTradingRulesDatabasePath()) {
    this.#database = new Database(databasePath);
    this.#database.pragma("journal_mode = WAL");
    this.#database.pragma("foreign_keys = ON");
    this.#database.exec(`
      CREATE TABLE IF NOT EXISTS ti_v3_manual_custom_rules (
        rule_id TEXT PRIMARY KEY,
        user_id TEXT NOT NULL,
        workspace_id TEXT NOT NULL,
        trading_account_id TEXT NOT NULL,
        status TEXT NOT NULL CHECK (status IN ('active', 'paused', 'retired')),
        current_version_ordinal TEXT NOT NULL,
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL
      );
      CREATE TABLE IF NOT EXISTS ti_v3_manual_custom_rule_versions (
        rule_id TEXT NOT NULL REFERENCES ti_v3_manual_custom_rules(rule_id),
        version_ordinal TEXT NOT NULL,
        title TEXT NOT NULL,
        statement TEXT NOT NULL,
        category TEXT NOT NULL,
        review_scope TEXT NOT NULL,
        is_focus INTEGER NOT NULL CHECK (is_focus IN (0, 1)),
        effective_from TEXT NOT NULL,
        PRIMARY KEY (rule_id, version_ordinal)
      );
      CREATE TABLE IF NOT EXISTS ti_v3_manual_custom_rule_lifecycle_events (
        rule_id TEXT NOT NULL REFERENCES ti_v3_manual_custom_rules(rule_id),
        sequence_ordinal INTEGER NOT NULL,
        event_type TEXT NOT NULL,
        previous_status TEXT,
        new_status TEXT NOT NULL,
        effective_at TEXT NOT NULL,
        PRIMARY KEY (rule_id, sequence_ordinal)
      );
      CREATE INDEX IF NOT EXISTS ti_v3_manual_custom_rules_owner
        ON ti_v3_manual_custom_rules (
          user_id, workspace_id, trading_account_id, updated_at DESC
        );
    `);
  }

  close(): void {
    this.#database.close();
  }

  #get(owner: ExecutionRuleOwnerScope, ruleId: string): ManualCustomRuleRecord | null {
    const row = this.#database.prepare(`
      SELECT r.rule_id, v.title, v.statement, v.category, v.review_scope,
             v.is_focus, r.status, v.version_ordinal, v.effective_from,
             r.created_at, r.updated_at
      FROM ti_v3_manual_custom_rules r
      JOIN ti_v3_manual_custom_rule_versions v
        ON v.rule_id = r.rule_id
       AND v.version_ordinal = r.current_version_ordinal
      WHERE r.rule_id = ? AND r.user_id = ? AND r.workspace_id = ?
        AND r.trading_account_id = ?
    `).get(ruleId, owner.userId, owner.workspaceId, accountKey(owner)) as ManualRuleRow | undefined;
    return row ? rowToRecord(row) : null;
  }

  #validateDefinition(input: Omit<CreateManualCustomRuleInput, "ruleId" | "owner" | "effectiveFrom">): void {
    requiredText(input.title, "title", 100);
    requiredText(input.statement, "statement", 1_000);
    if (!validChoice(input.category, MANUAL_CUSTOM_RULE_CATEGORIES)) {
      throw new Error("ti_v3_manual_rule_invalid_category");
    }
    if (!validChoice(input.reviewScope, MANUAL_CUSTOM_RULE_REVIEW_SCOPES)) {
      throw new Error("ti_v3_manual_rule_invalid_review_scope");
    }
    if (typeof input.isFocus !== "boolean") {
      throw new Error("ti_v3_manual_rule_invalid_focus");
    }
  }

  create(input: CreateManualCustomRuleInput): ManualCustomRuleRecord {
    this.#validateDefinition(input);
    const title = requiredText(input.title, "title", 100);
    const statement = requiredText(input.statement, "statement", 1_000);
    const effectiveFrom = validTimestamp(input.effectiveFrom, "effective_from");
    if (!/^manual-rule-[a-z0-9-]{8,}$/i.test(input.ruleId)) {
      throw new Error("ti_v3_manual_rule_invalid_id");
    }
    return this.#database.transaction(() => {
      this.#database.prepare(`
        INSERT INTO ti_v3_manual_custom_rules (
          rule_id, user_id, workspace_id, trading_account_id, status,
          current_version_ordinal, created_at, updated_at
        ) VALUES (?, ?, ?, ?, 'active', '1', ?, ?)
      `).run(input.ruleId, input.owner.userId, input.owner.workspaceId,
        accountKey(input.owner), effectiveFrom, effectiveFrom);
      this.#database.prepare(`
        INSERT INTO ti_v3_manual_custom_rule_versions (
          rule_id, version_ordinal, title, statement, category, review_scope,
          is_focus, effective_from
        ) VALUES (?, '1', ?, ?, ?, ?, ?, ?)
      `).run(input.ruleId, title, statement, input.category, input.reviewScope,
        input.isFocus ? 1 : 0, effectiveFrom);
      this.#database.prepare(`
        INSERT INTO ti_v3_manual_custom_rule_lifecycle_events (
          rule_id, sequence_ordinal, event_type, previous_status, new_status,
          effective_at
        ) VALUES (?, 1, 'activated', NULL, 'active', ?)
      `).run(input.ruleId, effectiveFrom);
      return this.#get(input.owner, input.ruleId)!;
    })();
  }

  revise(input: ReviseManualCustomRuleInput): ManualCustomRuleRecord {
    this.#validateDefinition(input);
    const existing = this.#get(input.owner, input.ruleId);
    if (!existing || existing.status !== "active" || existing.versionOrdinal !== input.expectedVersionOrdinal) {
      throw new Error("ti_v3_manual_rule_version_conflict");
    }
    const effectiveFrom = validTimestamp(input.effectiveFrom, "effective_from");
    if (effectiveFrom <= existing.updatedAt) {
      throw new Error("ti_v3_manual_rule_invalid_effective_from");
    }
    const nextOrdinal = String(Number(existing.versionOrdinal) + 1);
    const title = requiredText(input.title, "title", 100);
    const statement = requiredText(input.statement, "statement", 1_000);
    return this.#database.transaction(() => {
      this.#database.prepare(`
        INSERT INTO ti_v3_manual_custom_rule_versions (
          rule_id, version_ordinal, title, statement, category, review_scope,
          is_focus, effective_from
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `).run(input.ruleId, nextOrdinal, title, statement, input.category,
        input.reviewScope, input.isFocus ? 1 : 0, effectiveFrom);
      this.#database.prepare(`
        UPDATE ti_v3_manual_custom_rules
        SET current_version_ordinal = ?, updated_at = ?
        WHERE rule_id = ?
      `).run(nextOrdinal, effectiveFrom, input.ruleId);
      return this.#get(input.owner, input.ruleId)!;
    })();
  }

  transition(input: TransitionManualCustomRuleInput): ManualCustomRuleRecord {
    const existing = this.#get(input.owner, input.ruleId);
    if (!existing || existing.status !== input.expectedCurrentStatus || existing.status === "retired") {
      throw new Error("ti_v3_manual_rule_status_conflict");
    }
    if (input.newStatus === existing.status || (input.newStatus !== "active" && input.newStatus !== "paused" && input.newStatus !== "retired")) {
      throw new Error("ti_v3_manual_rule_invalid_transition");
    }
    const effectiveAt = validTimestamp(input.effectiveAt, "effective_at");
    if (effectiveAt <= existing.updatedAt) {
      throw new Error("ti_v3_manual_rule_invalid_effective_at");
    }
    const eventType = input.newStatus === "paused" ? "paused" : input.newStatus === "active" ? "resumed" : "retired";
    return this.#database.transaction(() => {
      const sequence = (this.#database.prepare(`
        SELECT COUNT(*) AS count FROM ti_v3_manual_custom_rule_lifecycle_events
        WHERE rule_id = ?
      `).get(input.ruleId) as { count: number }).count + 1;
      this.#database.prepare(`
        INSERT INTO ti_v3_manual_custom_rule_lifecycle_events (
          rule_id, sequence_ordinal, event_type, previous_status, new_status,
          effective_at
        ) VALUES (?, ?, ?, ?, ?, ?)
      `).run(input.ruleId, sequence, eventType, existing.status, input.newStatus, effectiveAt);
      this.#database.prepare(`
        UPDATE ti_v3_manual_custom_rules SET status = ?, updated_at = ?
        WHERE rule_id = ?
      `).run(input.newStatus, effectiveAt, input.ruleId);
      return this.#get(input.owner, input.ruleId)!;
    })();
  }

  list(owner: ExecutionRuleOwnerScope): readonly ManualCustomRuleRecord[] {
    const rows = this.#database.prepare(`
      SELECT r.rule_id, v.title, v.statement, v.category, v.review_scope,
             v.is_focus, r.status, v.version_ordinal, v.effective_from,
             r.created_at, r.updated_at
      FROM ti_v3_manual_custom_rules r
      JOIN ti_v3_manual_custom_rule_versions v
        ON v.rule_id = r.rule_id
       AND v.version_ordinal = r.current_version_ordinal
      WHERE r.user_id = ? AND r.workspace_id = ? AND r.trading_account_id = ?
      ORDER BY r.updated_at DESC, r.rule_id ASC
    `).all(owner.userId, owner.workspaceId, accountKey(owner)) as ManualRuleRow[];
    return Object.freeze(rows.map(rowToRecord));
  }
}
