import { randomUUID } from "node:crypto";

import Database from "better-sqlite3";

import { resolveTradeTagDatabasePath } from "@/src/lib/trader-intelligence-tags";

export type DaySessionJournalOwner = Readonly<{
  userId: string;
  workspaceId: string;
}>;

export type DaySessionDailyNote = Readonly<{
  anythingElse: string;
  createdAt: string;
  revision: string;
  sessionDate: string;
  technicalRecap: string;
  tomorrowsFocus: string;
  updatedAt: string;
  whatNeedsWork: string;
  whatWorked: string;
}>;

export type DaySessionRuleReviewStatus =
  | "followed"
  | "broken"
  | "not-reviewed";

export type DaySessionRuleReview = Readonly<{
  applicability: "day" | "trade";
  revision: string;
  ruleId: string;
  ruleVersion: string;
  status: DaySessionRuleReviewStatus;
  targetRoundTripKey: string | null;
}>;

type NoteRow = {
  anything_else: string;
  created_at: string;
  revision: string;
  session_date: string;
  technical_recap: string;
  tomorrows_focus: string;
  updated_at: string;
  what_needs_work: string;
  what_worked: string;
};

type RuleRow = {
  applicability: "day" | "trade";
  revision: string;
  rule_id: string;
  rule_version: string;
  status: DaySessionRuleReviewStatus;
  target_round_trip_key: string;
};

function timestamp(): string {
  return new Date().toISOString().replace(/Z$/, "000000Z");
}

function text(value: unknown, maximum = 10_000): string {
  if (typeof value !== "string") {
    throw new Error("ti_v3_day_session_journal_invalid_text");
  }
  const normalized = value.replace(/\r\n/g, "\n");
  if (normalized.length > maximum || /\u0000/.test(normalized)) {
    throw new Error("ti_v3_day_session_journal_invalid_text");
  }
  return normalized;
}

function date(value: unknown): string {
  if (
    typeof value !== "string" ||
    !/^\d{4}-\d{2}-\d{2}$/.test(value) ||
    Number.isNaN(Date.parse(`${value}T12:00:00.000Z`))
  ) {
    throw new Error("ti_v3_day_session_journal_invalid_date");
  }
  return value;
}

function note(row: NoteRow): DaySessionDailyNote {
  return Object.freeze({
    anythingElse: row.anything_else,
    createdAt: row.created_at,
    revision: row.revision,
    sessionDate: row.session_date,
    technicalRecap: row.technical_recap,
    tomorrowsFocus: row.tomorrows_focus,
    updatedAt: row.updated_at,
    whatNeedsWork: row.what_needs_work,
    whatWorked: row.what_worked,
  });
}

function rule(row: RuleRow): DaySessionRuleReview {
  return Object.freeze({
    applicability: row.applicability,
    revision: row.revision,
    ruleId: row.rule_id,
    ruleVersion: row.rule_version,
    status: row.status,
    targetRoundTripKey: row.target_round_trip_key || null,
  });
}

export class SqliteDaySessionJournalRepository {
  readonly #database: Database.Database;

  constructor(databasePath = resolveTradeTagDatabasePath()) {
    this.#database = new Database(databasePath);
    this.#database.pragma("journal_mode = WAL");
    this.#database.exec(`
      CREATE TABLE IF NOT EXISTS ti_v3_day_session_notes (
        user_id TEXT NOT NULL,
        workspace_id TEXT NOT NULL,
        session_date TEXT NOT NULL,
        what_worked TEXT NOT NULL,
        what_needs_work TEXT NOT NULL,
        technical_recap TEXT NOT NULL,
        tomorrows_focus TEXT NOT NULL,
        anything_else TEXT NOT NULL,
        revision TEXT NOT NULL,
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL,
        PRIMARY KEY (user_id, workspace_id, session_date)
      );
      CREATE TABLE IF NOT EXISTS ti_v3_day_session_rule_reviews (
        user_id TEXT NOT NULL,
        workspace_id TEXT NOT NULL,
        session_date TEXT NOT NULL,
        rule_id TEXT NOT NULL,
        rule_version TEXT NOT NULL,
        applicability TEXT NOT NULL CHECK (applicability IN ('day', 'trade')),
        target_round_trip_key TEXT NOT NULL,
        status TEXT NOT NULL CHECK (status IN ('followed', 'broken', 'not-reviewed')),
        revision TEXT NOT NULL,
        updated_at TEXT NOT NULL,
        PRIMARY KEY (
          user_id, workspace_id, session_date, rule_id, target_round_trip_key
        )
      );
    `);
  }

  close(): void {
    this.#database.close();
  }

  readNote(
    owner: DaySessionJournalOwner,
    sessionDate: string,
  ): DaySessionDailyNote | null {
    const row = this.#database.prepare(`
      SELECT session_date, what_worked, what_needs_work, technical_recap,
             tomorrows_focus, anything_else, revision, created_at, updated_at
      FROM ti_v3_day_session_notes
      WHERE user_id = ? AND workspace_id = ? AND session_date = ?
    `).get(owner.userId, owner.workspaceId, date(sessionDate)) as
      | NoteRow
      | undefined;
    return row ? note(row) : null;
  }

  saveNote(
    owner: DaySessionJournalOwner,
    input: Readonly<{
      anythingElse: unknown;
      expectedRevision: unknown;
      sessionDate: unknown;
      technicalRecap: unknown;
      tomorrowsFocus: unknown;
      whatNeedsWork: unknown;
      whatWorked: unknown;
    }>,
  ): DaySessionDailyNote {
    const sessionDate = date(input.sessionDate);
    const current = this.readNote(owner, sessionDate);
    const expected =
      input.expectedRevision === null || typeof input.expectedRevision === "string"
        ? input.expectedRevision
        : undefined;
    if (
      expected === undefined ||
      (current === null ? expected !== null : expected !== current.revision)
    ) {
      throw new Error("ti_v3_day_session_journal_revision_conflict");
    }
    const now = timestamp();
    const revision = randomUUID();
    const values = {
      anythingElse: text(input.anythingElse),
      technicalRecap: text(input.technicalRecap),
      tomorrowsFocus: text(input.tomorrowsFocus),
      whatNeedsWork: text(input.whatNeedsWork),
      whatWorked: text(input.whatWorked),
    };
    this.#database.prepare(`
      INSERT INTO ti_v3_day_session_notes (
        user_id, workspace_id, session_date, what_worked, what_needs_work,
        technical_recap, tomorrows_focus, anything_else, revision,
        created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      ON CONFLICT (user_id, workspace_id, session_date) DO UPDATE SET
        what_worked = excluded.what_worked,
        what_needs_work = excluded.what_needs_work,
        technical_recap = excluded.technical_recap,
        tomorrows_focus = excluded.tomorrows_focus,
        anything_else = excluded.anything_else,
        revision = excluded.revision,
        updated_at = excluded.updated_at
    `).run(
      owner.userId,
      owner.workspaceId,
      sessionDate,
      values.whatWorked,
      values.whatNeedsWork,
      values.technicalRecap,
      values.tomorrowsFocus,
      values.anythingElse,
      revision,
      current?.createdAt ?? now,
      now,
    );
    return this.readNote(owner, sessionDate)!;
  }

  readRuleReviews(
    owner: DaySessionJournalOwner,
    sessionDate: string,
  ): readonly DaySessionRuleReview[] {
    const rows = this.#database.prepare(`
      SELECT rule_id, rule_version, applicability, target_round_trip_key,
             status, revision
      FROM ti_v3_day_session_rule_reviews
      WHERE user_id = ? AND workspace_id = ? AND session_date = ?
      ORDER BY rule_id, target_round_trip_key
    `).all(owner.userId, owner.workspaceId, date(sessionDate)) as RuleRow[];
    return Object.freeze(rows.map(rule));
  }

  saveRuleReview(
    owner: DaySessionJournalOwner,
    sessionDateInput: unknown,
    input: Readonly<{
      applicability: unknown;
      expectedRevision: unknown;
      ruleId: unknown;
      ruleVersion: unknown;
      status: unknown;
      targetRoundTripKey: unknown;
    }>,
  ): DaySessionRuleReview {
    const sessionDate = date(sessionDateInput);
    const applicability =
      input.applicability === "day" || input.applicability === "trade"
        ? input.applicability
        : null;
    const status =
      input.status === "followed" ||
      input.status === "broken" ||
      input.status === "not-reviewed"
        ? input.status
        : null;
    const ruleId = text(input.ruleId, 200);
    const ruleVersion = text(input.ruleVersion, 200);
    const targetRoundTripKey =
      input.targetRoundTripKey === null ? "" : text(input.targetRoundTripKey, 300);
    if (
      applicability === null ||
      status === null ||
      (applicability === "day" && targetRoundTripKey !== "") ||
      (applicability === "trade" && targetRoundTripKey === "")
    ) {
      throw new Error("ti_v3_day_session_rule_review_invalid");
    }
    const current = this.readRuleReviews(owner, sessionDate).find(
      (candidate) =>
        candidate.ruleId === ruleId &&
        (candidate.targetRoundTripKey ?? "") === targetRoundTripKey,
    );
    const expected =
      input.expectedRevision === null || typeof input.expectedRevision === "string"
        ? input.expectedRevision
        : undefined;
    if (
      expected === undefined ||
      (current === undefined ? expected !== null : expected !== current.revision)
    ) {
      throw new Error("ti_v3_day_session_journal_revision_conflict");
    }
    const revision = randomUUID();
    this.#database.prepare(`
      INSERT INTO ti_v3_day_session_rule_reviews (
        user_id, workspace_id, session_date, rule_id, rule_version,
        applicability, target_round_trip_key, status, revision, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      ON CONFLICT (
        user_id, workspace_id, session_date, rule_id, target_round_trip_key
      ) DO UPDATE SET
        rule_version = excluded.rule_version,
        applicability = excluded.applicability,
        status = excluded.status,
        revision = excluded.revision,
        updated_at = excluded.updated_at
    `).run(
      owner.userId,
      owner.workspaceId,
      sessionDate,
      ruleId,
      ruleVersion,
      applicability,
      targetRoundTripKey,
      status,
      revision,
      timestamp(),
    );
    return this.readRuleReviews(owner, sessionDate).find(
      (candidate) =>
        candidate.ruleId === ruleId &&
        (candidate.targetRoundTripKey ?? "") === targetRoundTripKey,
    )!;
  }
}
