import { mkdirSync } from "node:fs";
import { homedir, tmpdir } from "node:os";
import { isAbsolute, join, resolve } from "node:path";

import Database from "better-sqlite3";

import {
  InMemoryExecutionRuleRepository,
  type CreateExecutionRuleInput,
  type ExecutionRuleOwnerScope,
  type ExecutionRuleRecordSnapshot,
  type ReviseExecutionRuleInput,
  type TransitionExecutionRuleLifecycleInput,
} from "@/src/lib/trader-intelligence-v3/analytics/rules";
import { resolveTraderIntelligenceLocalPersistence } from "@/src/lib/trader-intelligence-v3/deployment";

type StoredRuleCommand =
  | Readonly<{ type: "create"; input: CreateExecutionRuleInput }>
  | Readonly<{ type: "revise"; input: ReviseExecutionRuleInput }>
  | Readonly<{
      type: "transition_lifecycle";
      input: TransitionExecutionRuleLifecycleInput;
    }>;

type StoredCommandRow = Readonly<{ command_json: string }>;

function accountKey(owner: ExecutionRuleOwnerScope): string {
  return owner.tradingAccountId ?? "";
}

function sameOwner(
  left: ExecutionRuleOwnerScope,
  right: ExecutionRuleOwnerScope,
): boolean {
  return (
    left.userId === right.userId &&
    left.workspaceId === right.workspaceId &&
    left.tradingAccountId === right.tradingAccountId
  );
}

export function resolveTradingRulesDatabasePath(): string {
  const configuredPath =
    process.env.TRADER_INTELLIGENCE_RULES_DB_PATH?.trim() ||
    process.env.TRADER_INTELLIGENCE_DB_PATH?.trim();
  const privateRoot =
    process.env.TRADER_INTELLIGENCE_PRIVATE_DATA_ROOT?.trim();
  const localOnly =
    process.env.TRADER_INTELLIGENCE_HOSTING_MODE === "local_only";

  let databasePath: string;
  if (configuredPath) {
    databasePath = isAbsolute(configuredPath)
      ? configuredPath
      : privateRoot
        ? resolve(privateRoot, configuredPath)
        : "";
  } else if (localOnly || process.env.NODE_ENV !== "production") {
    const localRoot =
      process.env.LOCALAPPDATA?.trim() ||
      join(homedir(), "AppData", "Local");
    databasePath = join(
      localRoot,
      "TraderLink",
      "TraderIntelligence",
      "trading-rules-v1.sqlite",
    );
  } else {
    throw new Error("ti_v3_rules_db_path_missing");
  }

  const persistence = resolveTraderIntelligenceLocalPersistence({
    environment: {
      ...process.env,
      TRADER_INTELLIGENCE_DB_PATH: databasePath,
      TRADER_INTELLIGENCE_PRIVATE_DATA_ROOT: privateRoot,
    },
    dataMode: "real_owner_data",
    repositoryRoot: process.cwd(),
    temporaryRoot: tmpdir(),
  });
  if (!persistence.ok || persistence.kind !== "file") {
    throw new Error(
      persistence.ok ? "ti_v3_rules_db_path_invalid" : persistence.code,
    );
  }
  mkdirSync(persistence.parentPath, { recursive: true });
  return persistence.databaseTarget;
}

function parseCommand(source: string): StoredRuleCommand {
  let parsed: unknown;
  try {
    parsed = JSON.parse(source);
  } catch {
    throw new Error("ti_v3_rules_command_corrupt");
  }
  if (
    typeof parsed !== "object" ||
    parsed === null ||
    !("type" in parsed) ||
    !("input" in parsed) ||
    (parsed.type !== "create" &&
      parsed.type !== "revise" &&
      parsed.type !== "transition_lifecycle")
  ) {
    throw new Error("ti_v3_rules_command_corrupt");
  }
  return parsed as StoredRuleCommand;
}

export class SqliteExecutionRuleRepository {
  readonly #database: Database.Database;

  constructor(databasePath = resolveTradingRulesDatabasePath()) {
    this.#database = new Database(databasePath);
    this.#database.pragma("journal_mode = WAL");
    this.#database.pragma("foreign_keys = ON");
    this.#database.exec(`
      CREATE TABLE IF NOT EXISTS ti_v3_execution_rule_commands (
        command_sequence INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id TEXT NOT NULL,
        workspace_id TEXT NOT NULL,
        trading_account_id TEXT NOT NULL,
        command_type TEXT NOT NULL
          CHECK (command_type IN ('create', 'revise', 'transition_lifecycle')),
        command_json TEXT NOT NULL,
        created_at TEXT NOT NULL
      );
      CREATE INDEX IF NOT EXISTS ti_v3_execution_rule_commands_owner
        ON ti_v3_execution_rule_commands (
          user_id,
          workspace_id,
          trading_account_id,
          command_sequence
        );
    `);
  }

  close(): void {
    this.#database.close();
  }

  #replay(
    owner: ExecutionRuleOwnerScope,
  ): InMemoryExecutionRuleRepository {
    const repository = new InMemoryExecutionRuleRepository();
    const rows = this.#database
      .prepare(
        `
          SELECT command_json
          FROM ti_v3_execution_rule_commands
          WHERE user_id = ?
            AND workspace_id = ?
            AND trading_account_id = ?
          ORDER BY command_sequence ASC
        `,
      )
      .all(
        owner.userId,
        owner.workspaceId,
        accountKey(owner),
      ) as StoredCommandRow[];

    for (const row of rows) {
      const command = parseCommand(row.command_json);
      if (!sameOwner(command.input.owner, owner)) {
        throw new Error("ti_v3_rules_command_owner_mismatch");
      }
      const replayed =
        command.type === "create"
          ? repository.create(command.input)
          : command.type === "revise"
            ? repository.revise(command.input)
            : repository.transitionLifecycle(command.input);
      if (!replayed.ok) {
        throw new Error(
          `ti_v3_rules_command_replay_failed:${replayed.error.code}:${replayed.error.path}`,
        );
      }
    }
    return repository;
  }

  #append(owner: ExecutionRuleOwnerScope, command: StoredRuleCommand): void {
    this.#database
      .prepare(
        `
          INSERT INTO ti_v3_execution_rule_commands (
            user_id,
            workspace_id,
            trading_account_id,
            command_type,
            command_json,
            created_at
          ) VALUES (?, ?, ?, ?, ?, ?)
        `,
      )
      .run(
        owner.userId,
        owner.workspaceId,
        accountKey(owner),
        command.type,
        JSON.stringify(command),
        new Date().toISOString(),
      );
  }

  create(input: CreateExecutionRuleInput): ExecutionRuleRecordSnapshot {
    return this.#database.transaction(() => {
      const repository = this.#replay(input.owner);
      const created = repository.create(input);
      if (!created.ok) {
        throw new Error(`${created.error.code}:${created.error.path}`);
      }
      this.#append(input.owner, { type: "create", input });
      return created.value;
    })();
  }

  revise(input: ReviseExecutionRuleInput): ExecutionRuleRecordSnapshot {
    return this.#database.transaction(() => {
      const repository = this.#replay(input.owner);
      const revised = repository.revise(input);
      if (!revised.ok) {
        throw new Error(`${revised.error.code}:${revised.error.path}`);
      }
      this.#append(input.owner, { type: "revise", input });
      return revised.value;
    })();
  }

  transitionLifecycle(
    input: TransitionExecutionRuleLifecycleInput,
  ): ExecutionRuleRecordSnapshot {
    return this.#database.transaction(() => {
      const repository = this.#replay(input.owner);
      const transitioned = repository.transitionLifecycle(input);
      if (!transitioned.ok) {
        throw new Error(
          `${transitioned.error.code}:${transitioned.error.path}`,
        );
      }
      this.#append(input.owner, {
        type: "transition_lifecycle",
        input,
      });
      return transitioned.value;
    })();
  }

  list(owner: ExecutionRuleOwnerScope): readonly ExecutionRuleRecordSnapshot[] {
    return this.#replay(owner).list(owner);
  }

  get(
    owner: ExecutionRuleOwnerScope,
    ruleInstanceId: string,
  ): ExecutionRuleRecordSnapshot | null {
    return this.#replay(owner).get(owner, ruleInstanceId);
  }

  listLifecycleEvents(
    owner: ExecutionRuleOwnerScope,
    ruleInstanceId: string,
  ) {
    return this.#replay(owner).listLifecycleEvents(owner, ruleInstanceId);
  }
}
