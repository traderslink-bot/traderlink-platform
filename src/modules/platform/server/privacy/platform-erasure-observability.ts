/** Phase-only diagnostics: never log identifiers, paths, file keys or errors. */
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

export function observeErasurePhase<T>(phase: string, operation: () => T): T {
  const started = performance.now();
  let state: "finished" | "failed" = "finished";
  let failureKind: string | undefined;
  if (process.env.NODE_ENV === "production") console.info("platform_erasure_phase", {
    phase, state: "started", atUtc: new Date().toISOString(),
  });
  try { return operation(); }
  catch (error) { state = "failed"; failureKind = classifyErasureFailure(error); throw error; }
  finally {
    if (process.env.NODE_ENV === "production") console.info("platform_erasure_phase", {
      phase, state, atUtc: new Date().toISOString(), durationMs: Math.round(performance.now() - started),
      ...(failureKind ? { failureKind } : {}),
    });
  }
}
