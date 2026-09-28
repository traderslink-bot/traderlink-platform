type MaintenancePhase = "preflight" | "checkpoint" | "checkpoint_directories"
  | "source_evidence" | "backup_evidence" | "restore_evidence"
  | "source_hash" | "backup_hash" | "restore_hash" | "backup_copy" | "restore_copy"
  | "migration" | "readiness";

function report(
  phase: MaintenancePhase,
  status: "started" | "completed" | "failed",
  startedAt: number,
): void {
  try {
    console.info("TraderLink hosted database maintenance phase.", {
      phase,
      status,
      durationMs: Math.max(0, Date.now() - startedAt),
    });
  } catch {
    // Diagnostics never change a checkpoint result or expose error/data contents.
  }
}

export function observePlatformMaintenancePhase<T>(
  phase: MaintenancePhase,
  operation: () => T,
): T {
  const startedAt = Date.now();
  report(phase, "started", startedAt);
  try {
    const result = operation();
    report(phase, "completed", startedAt);
    return result;
  } catch (error) {
    report(phase, "failed", startedAt);
    throw error;
  }
}

export async function observePlatformMaintenancePhaseAsync<T>(
  phase: MaintenancePhase,
  operation: () => Promise<T>,
): Promise<T> {
  const startedAt = Date.now();
  report(phase, "started", startedAt);
  try {
    const result = await operation();
    report(phase, "completed", startedAt);
    return result;
  } catch (error) {
    report(phase, "failed", startedAt);
    throw error;
  }
}
