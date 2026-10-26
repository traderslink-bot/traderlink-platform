import type Database from "better-sqlite3";

type Column = { name: string; pk: number };
type ForeignKey = { id: number; seq: number; table: string; from: string; to: string | null; on_delete: string };
type Table = { name: string; columns: Column[]; keys: string[]; temporary: string };
export type ErasureRoot = Readonly<{ table: string; column: string; value: string; workspaceId?: string }>;

function quote(value: string): string {
  if (!/^[a-z_][a-z0-9_]*$/u.test(value)) throw new Error("erasure_schema_identifier");
  return `"${value}"`;
}

/** Materialized BEFORE any delete, inside the caller's immediate transaction.
 * Only incoming FK edges from selected rows are followed. Never selects an
 * orphan by absence of its parent. Temporary keys contain no source payload.
 */
export function captureErasureClosure(
  database: Database.Database,
  roots: readonly ErasureRoot[],
  options: Readonly<{ maxRows?: number; excludeTables?: readonly string[];
    workspaceId?: string; accountIds?: readonly string[]; maxElapsedMs?: number }> = {},
): Readonly<{ rowCount: number; deleteRows(): number; dispose(): void }> {
  if (!database.inTransaction) throw new Error("erasure_requires_transaction");
  const maxRows = options.maxRows ?? 1_000_000;
  const startedAt = performance.now();
  const maxElapsedMs = options.maxElapsedMs ?? 30_000;
  if (!Number.isSafeInteger(maxRows) || maxRows < 1) throw new Error("erasure_row_budget");
  const excluded = new Set(["platform_schema_migrations", ...(options.excludeTables ?? [])]);
  const schema = database.prepare<[], { name: string; sql: string }>(
    "SELECT name, sql FROM sqlite_schema WHERE type='table' AND name NOT LIKE 'sqlite_%' ORDER BY name",
  ).all().filter((row) => !excluded.has(row.name));
  const tables = new Map<string, Table>();
  const dispose = () => {
    for (const table of tables.values()) database.exec(`DROP TABLE IF EXISTS temp.${quote(table.temporary)}`);
  };
  try {
    for (const row of schema) {
      const columns = database.prepare<[], Column>(`PRAGMA main.table_info(${quote(row.name)})`).all();
      const primary = columns.filter((column) => column.pk > 0).sort((a, b) => a.pk - b.pk).map((c) => c.name);
      const rowId = ["_rowid_", "rowid", "oid"].find((name) => !columns.some((c) => c.name === name));
      const keys = /WITHOUT\s+ROWID/iu.test(row.sql) ? primary : rowId ? [rowId] : primary;
      if (keys.length === 0 || /CREATE\s+VIRTUAL/iu.test(row.sql)) throw new Error("erasure_unsupported_table");
      const temporary = `erasure_keys_${tables.size}`;
      const table = { name: row.name, columns, keys, temporary };
      tables.set(table.name, table);
      database.exec(`CREATE TEMP TABLE ${quote(temporary)} (${keys.map((_, i) => `k${i} NOT NULL`).join(",")}, PRIMARY KEY (${keys.map((_, i) => `k${i}`).join(",")})) WITHOUT ROWID`);
    }
    const keyJoin = (table: Table, alias: string, selected: string) => table.keys.map((key, i) =>
      `${alias}.${quote(key)} = ${selected}.k${i}`).join(" AND ");
    const insert = (table: Table, from: string, where = "", bindings: string[] = []) => {
      const changed = database.prepare(`INSERT OR IGNORE INTO temp.${quote(table.temporary)}
        SELECT DISTINCT ${table.keys.map((key) => `child.${quote(key)}`).join(",")} ${from} ${where}
        ${where ? "AND" : "WHERE"} NOT EXISTS (SELECT 1 FROM temp.${quote(table.temporary)} seen WHERE ${keyJoin(table, "child", "seen")})
        LIMIT ${maxRows - rowCount + 1}`).run(...bindings).changes;
      rowCount += changed;
      if (rowCount > maxRows) throw new Error("erasure_row_budget");
      if (performance.now() - startedAt > maxElapsedMs) throw new Error("erasure_phase_budget");
      return changed;
    };
    let rowCount = 0;
    for (const root of roots) {
      const table = tables.get(root.table);
      if (!table || !table.columns.some((column) => column.name === root.column)) throw new Error("erasure_unknown_root");
      const restrictWorkspace = root.workspaceId && root.column !== "workspace_id"
        && table.columns.some((column) => column.name === "workspace_id");
      insert(table, `FROM main.${quote(table.name)} child`,
        `WHERE child.${quote(root.column)} = ?${restrictWorkspace ? " AND child.workspace_id=?" : ""}`,
        restrictWorkspace ? [root.value, root.workspaceId!] : [root.value]);
    }
    const edges: { child: Table; parent: Table; match: string }[] = [];
    for (const child of tables.values()) {
      const groups = new Map<number, ForeignKey[]>();
      for (const fk of database.prepare<[], ForeignKey>(`PRAGMA main.foreign_key_list(${quote(child.name)})`).all()) {
        const group = groups.get(fk.id) ?? [];
        group.push(fk);
        groups.set(fk.id, group);
      }
      for (const group of groups.values()) {
        const ordered = group.sort((a, b) => a.seq - b.seq);
        // Native SET NULL/DEFAULT redacts a reference while preserving its
        // shared payload. It is not authorization to erase that child row.
        // Explicitly owned rows are still selected by the authorized roots.
        const onDelete = ordered[0]!.on_delete;
        if (onDelete === "SET NULL" || onDelete === "SET DEFAULT") continue;
        if (!["CASCADE", "RESTRICT", "NO ACTION"].includes(onDelete)) throw new Error("erasure_unknown_foreign_key_policy");
        const parentName = ordered[0]!.table.toLowerCase();
        const parent = tables.get(parentName);
        // References to excluded tables must never provide a path into them.
        if (!parent) {
          if (excluded.has(parentName)) continue;
          throw new Error("erasure_unknown_foreign_key_parent");
        }
        const primary = parent.columns.filter((column) => column.pk > 0).sort((a, b) => a.pk - b.pk);
        if (ordered.some((fk) => !fk.to) && primary.length !== ordered.length) throw new Error("erasure_unknown_parent_key");
        const match = ordered.map((fk, i) => `parent.${quote(fk.to || primary[i]!.name)} = child.${quote(fk.from)}`).join(" AND ");
        edges.push({ child, parent, match });
      }
    }
    // Finite row budget bounds cycle expansion, rather than truncating at an
    // arbitrary graph depth. Empty parent sets do not touch child data.
    for (;;) {
      let changed = 0;
      for (const edge of edges) {
        if (!database.prepare(`SELECT 1 FROM temp.${quote(edge.parent.temporary)} LIMIT 1`).get()) continue;
        changed += insert(edge.child, `FROM temp.${quote(edge.parent.temporary)} selected
          JOIN main.${quote(edge.parent.name)} parent ON ${keyJoin(edge.parent, "parent", "selected")}
          JOIN main.${quote(edge.child.name)} child ON ${edge.match}`);
      }
      if (changed === 0) break;
    }
    // Reachability is not permission to erase another workspace/account. Refuse
    // the whole transaction if a shared/cross-scope relation needs a policy.
    for (const table of tables.values()) {
      const checks: { sql: string; values: string[] }[] = [];
      if (options.workspaceId && table.columns.some((column) => column.name === "workspace_id")) {
        checks.push({ sql: "target.workspace_id IS NOT NULL AND target.workspace_id <> ?", values: [options.workspaceId] });
      }
      if (options.accountIds && table.columns.some((column) => column.name === "account_id")) {
        checks.push({ sql: options.accountIds.length
          ? `target.account_id IS NOT NULL AND target.account_id NOT IN (${options.accountIds.map(() => "?").join(",")})`
          : "target.account_id IS NOT NULL", values: [...options.accountIds] });
      }
      for (const check of checks) {
        if (database.prepare(`SELECT 1 FROM temp.${quote(table.temporary)} selected
          JOIN main.${quote(table.name)} target ON ${keyJoin(table, "target", "selected")}
          WHERE ${check.sql} LIMIT 1`).get(...check.values)) throw new Error("erasure_cross_scope_dependency");
      }
    }
    let deleted = false;
    return Object.freeze({
      rowCount,
      deleteRows() {
        if (!database.inTransaction || deleted) throw new Error("erasure_closure_state");
        deleted = true;
        let removed = 0;
        for (const table of [...tables.values()].reverse()) {
          removed += database.prepare(`DELETE FROM main.${quote(table.name)} WHERE
            (${table.keys.map(quote).join(",")}) IN
            (SELECT ${table.keys.map((_, i) => `k${i}`).join(",")} FROM temp.${quote(table.temporary)})`).run().changes;
        }
        return removed;
      },
      dispose,
    });
  } catch (error) {
    dispose();
    throw error;
  }
}
