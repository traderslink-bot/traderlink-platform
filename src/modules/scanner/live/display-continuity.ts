import type { ScannerReadModel } from "./contracts";

export const EMPTY_SCANNER_CONTINUITY_MS = 30_000;

export type ScannerDisplayContinuity = Readonly<{ emptySince: number | null }>;

const TERMINAL_STATUSES = new Set<ScannerReadModel["status"]>(["disabled", "closed", "universe_missing"]);

export function scannerModelHasRows(model: ScannerReadModel): boolean {
  return Boolean(
    model.gainers.rows.length ||
    model.gainers.focus.length ||
    model.dayGainers?.rows.length ||
    model.dayGainers?.focus.length ||
    model.momentum.rows.length ||
    model.momentum.focus.length ||
    model.declines?.rapid.length ||
    model.declines?.losers.length ||
    model.premarketPullbacks?.rows.length
  );
}

export function applyScannerDisplayContinuity(
  previous: ScannerReadModel | null,
  incoming: ScannerReadModel,
  continuity: ScannerDisplayContinuity,
  now: number,
): Readonly<{ model: ScannerReadModel; continuity: ScannerDisplayContinuity }> {
  const contextChanged = previous !== null && (
    previous.tradingDate !== incoming.tradingDate || previous.provider !== incoming.provider ||
    (incoming.session !== null && previous.session !== incoming.session)
  );

  if (
    previous === null ||
    contextChanged ||
    TERMINAL_STATUSES.has(incoming.status) ||
    incoming.refreshAfterMs===1000&&incoming.status==="unavailable" ||
    scannerModelHasRows(incoming) ||
    !scannerModelHasRows(previous)
  ) {
    return { model: incoming, continuity: { emptySince: null } };
  }

  const emptySince = continuity.emptySince ?? now;
  if (now - emptySince <= EMPTY_SCANNER_CONTINUITY_MS) {
    return { model: previous, continuity: { emptySince } };
  }

  return { model: incoming, continuity: { emptySince } };
}
