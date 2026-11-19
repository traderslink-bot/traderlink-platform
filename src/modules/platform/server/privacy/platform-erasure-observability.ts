/** Safe diagnostics: no personal identifiers, paths, file keys or error text. */
export function classifyErasureFailure(error: unknown): string {
  // Read only an own data property. Never stringify a driver error, traverse
  // its cause/stack, or invoke an arbitrary exception getter in a failure path.
  try {
    if (!error || typeof error !== "object") return "unknown";
    const code: unknown = Object.getOwnPropertyDescriptor(error, "code")?.value;
    if (code === "not_admitted") return "admission_required";
    if (code === "held" || code === "conflict" || code === "unqualified") return "admission_hold";
    if (typeof code === "string" && /^SQLITE_BUSY(?:_|$)/u.test(code)) return "sqlite_busy";
    if (typeof code === "string" && /^SQLITE_LOCKED(?:_|$)/u.test(code)) return "sqlite_locked";
    if (code === "SQLITE_FULL") return "sqlite_full";
    if (typeof code === "string" && /^SQLITE_IOERR(?:_|$)/u.test(code)) return "sqlite_io";
    return "unknown";
  } catch { return "unknown"; }
}

type TableObservation = Readonly<{ table: string; selectedRows: number; parentTable?: string }>;

function observe<T>(phase: string, operation: () => T, table?: TableObservation): T {
  const started = performance.now();
  let state: "finished" | "failed" = "finished";
  let failureKind: string | undefined;
  const production = process.env.NODE_ENV === "production";
  // One string per event: worker stdout and main stdout may interleave lines.
  // Table events report only slow queries or failures to keep volume bounded.
  if (production && !table) console.info(JSON.stringify({
    event: "platform_erasure_phase", phase, state: "started", atUtc: new Date().toISOString(),
  }));
  try { return operation(); }
  catch (error) { state = "failed"; failureKind = classifyErasureFailure(error); throw error; }
  finally {
    const durationMs = Math.round(performance.now() - started);
    if (production && (!table || durationMs >= 50 || state === "failed")) console.info(JSON.stringify({
      event: "platform_erasure_phase", phase, state, atUtc: new Date().toISOString(), durationMs,
      ...table,
      ...(failureKind ? { failureKind } : {}),
    }));
  }
}

export function observeErasurePhase<T>(phase: string, operation: () => T): T {
  return observe(phase, operation);
}

/** Callers supply canonical schema names and selected-key counts, never values. */
export function observeErasureTable<T>(
  phase: "capture_root_table" | "capture_fk_edge" | "delete_table",
  table: string, selectedRows: number, operation: () => T, parentTable?: string,
): T {
  const identifier = /^[a-z_][a-z0-9_]{0,127}$/u;
  if (!identifier.test(table) || (parentTable !== undefined && !identifier.test(parentTable))
    || !Number.isSafeInteger(selectedRows) || selectedRows < 0) return operation();
  return observe(phase, operation, { table, selectedRows, ...(parentTable ? { parentTable } : {}) });
}
