/** Process-local invalidation only. Durable correction facts belong to the shared ledger. */
type Corrections = { revisions: Map<string, { revision: string; generation?: number }>; observers: Map<string, (source: string, invalidateResults: boolean) => void> };
const state = globalThis as typeof globalThis & { traderlinkScreenerRunCorrections?: Corrections };
const corrections = state.traderlinkScreenerRunCorrections ??= { revisions: new Map(), observers: new Map() };

export function screenerCorrectionRevision(source: string) {
  const current = corrections.revisions.get(source);
  return current?.generation === 0 ? undefined : current?.revision;
}
export function screenerCorrectionGeneration(source: string) { return corrections.revisions.get(source)?.generation; }

export function observeScreenerCorrectionRevision(source: string, revision: string | undefined, generation?: number) {
  if (revision === undefined) return;
  if (!/^[a-f0-9]{64}$/.test(revision)) throw Error("screener_correction_revision_invalid");
  if (generation !== undefined && (!Number.isSafeInteger(generation) || generation < 0)) throw Error("screener_correction_revision_invalid");
  const previous = corrections.revisions.get(source);
  if (previous?.generation !== undefined && previous.generation > 0 && (generation === undefined || generation < previous.generation))
    throw Error("screener_correction_superseded");
  const changed = generation !== 0 && previous?.revision !== revision && (generation === undefined || previous?.generation === undefined || generation > previous.generation);
  corrections.revisions.delete(source);
  corrections.revisions.set(source, { revision, generation });
  // Runs are already bounded to 64 process-wide. Old provider-selection epochs
  // cannot publish again through the existing receiver selection guard.
  while (corrections.revisions.size > 128) corrections.revisions.delete(corrections.revisions.keys().next().value!);
  if (previous?.revision !== revision) for (const observer of corrections.observers.values()) observer(source, changed);
}

export function onScreenerCorrectionRevision(owner: string, observer: (source: string, invalidateResults: boolean) => void) {
  corrections.observers.set(owner, observer);
}
