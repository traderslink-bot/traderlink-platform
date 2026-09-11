import { AsyncLocalStorage } from "node:async_hooks";

type TimingName = "auth" | "watchlist" | "json" | "integrity"
  | "integrity_manifest" | "integrity_registry" | "integrity_schema"
  | "integrity_foreign_keys" | "integrity_quick_check";
type Measurements = Map<TimingName, { duration: number; count: number }>;
const context = new AsyncLocalStorage<Measurements>();

/** Request-local numbers only: never retains identities, database handles or payloads. */
export function measurePlatformRequestPhase<T>(name: TimingName, operation: () => T): T {
  const measurements = context.getStore();
  if (!measurements) return operation();
  const started = performance.now();
  try { return operation(); }
  finally { record(measurements, name, started); }
}

function record(measurements: Measurements, name: TimingName, started: number): void {
  const previous = measurements.get(name);
  measurements.set(name, { duration: (previous?.duration ?? 0) + performance.now() - started,
    count: (previous?.count ?? 0) + 1 });
}

export async function measurePlatformRequestPhaseAsync<T>(name: TimingName, operation: () => Promise<T>): Promise<T> {
  const measurements = context.getStore();
  if (!measurements) return operation();
  const started = performance.now();
  try { return await operation(); }
  finally { record(measurements, name, started); }
}

export function withPlatformRequestTiming<T extends Response>(operation: () => Promise<T>): Promise<T> {
  return context.run(new Map(), async () => {
    const started = performance.now();
    const response = await operation();
    // Failed authorization does not expose internal request phases.
    if (response.ok) {
      const measurements = context.getStore()!;
      const entries = Array.from(measurements, ([name, value]) =>
        `${name};dur=${value.duration.toFixed(1)};desc="${value.count} calls"`);
      entries.push(`handler;dur=${(performance.now() - started).toFixed(1)}`);
      response.headers.set("Server-Timing", entries.join(", "));
    }
    return response;
  });
}
