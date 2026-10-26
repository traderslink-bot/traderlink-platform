/** Phase-only diagnostics: never log identifiers, paths, file keys or errors. */
export function observeErasurePhase<T>(phase: string, operation: () => T): T {
  const started = performance.now();
  if (process.env.NODE_ENV === "production") console.info("platform_erasure_phase", { phase, state: "started" });
  try { return operation(); }
  finally {
    if (process.env.NODE_ENV === "production") console.info("platform_erasure_phase", {
      phase, state: "finished", durationMs: Math.round(performance.now() - started),
    });
  }
}
