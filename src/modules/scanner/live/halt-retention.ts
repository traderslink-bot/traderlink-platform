import type { LiveScreenResults, ScannerConfiguration, ScannerReadModel } from "./contracts";

type ScannerLists = Pick<ScannerReadModel, "gainers" | "dayGainers" | "momentum" | "declines" | "premarketPullbacks">;
type EvaluatedLists = ScannerLists & { dayGainers: LiveScreenResults };

export function retainHaltedScannerRows(
  current: EvaluatedLists,
  previous: ScannerLists,
  halted: ReadonlySet<string>,
  eligible: ReadonlySet<string>,
  configuration: ScannerConfiguration,
): EvaluatedLists {
  if (!halted.size) return current;

  function retain<Row extends { symbol: string }>(
    rows: readonly Row[], prior: readonly Row[] = [], limit: number, total: number,
  ) {
    const held = prior.flatMap((row, index) => halted.has(row.symbol) && eligible.has(row.symbol) ? [{ row, index }] : []);
    if (!held.length) return { rows, total };
    const heldSymbols = new Set(held.map(({ row }) => row.symbol));
    const ranked = rows.filter(row => !heldSymbols.has(row.symbol));
    const replaced = rows.length - ranked.length;
    for (const { row, index } of held) ranked.splice(Math.min(index, limit - 1), 0, row);
    return { rows: ranked.slice(0, limit), total: total + held.length - replaced };
  }

  function screen(results: LiveScreenResults, prior: LiveScreenResults | undefined, limit: number, focusLimit: number) {
    const main = retain(results.rows, prior?.rows, limit, results.total);
    const focus = focusLimit > 0 ? retain(results.focus, prior?.focus, focusLimit, results.focus.length).rows : results.focus;
    return { ...results, ...main, focus };
  }

  const gainerLimit = configuration.gainers.displayLimit;
  const momentumLimit = configuration.momentum.displayLimit;
  const gainers = screen(current.gainers, previous.gainers, gainerLimit,
    configuration.gainers.focus.maximumStocks);
  const dayGainers = screen(current.dayGainers, previous.dayGainers, gainerLimit, 0);
  const momentum = screen(current.momentum, previous.momentum, momentumLimit,
    configuration.momentum.focus.maximumStocks);
  const sections = momentum.momentumSections;
  const priorSections = previous.momentum.momentumSections;
  const heldInSection = (rows: readonly LiveScreenResults["rows"][number][] = []) =>
    new Set(rows.filter(row => halted.has(row.symbol) && eligible.has(row.symbol)).map(row => row.symbol));
  const oppositeSection = (rows: LiveScreenResults["rows"], total: number, opposite: ReadonlySet<string>) => {
    const matching = rows.filter(row => !opposite.has(row.symbol));
    return { rows: matching, total: total - (rows.length - matching.length) };
  };
  const retainedSections = sections && (() => {
    const confirmed = oppositeSection(sections.confirmed, sections.confirmedTotal, heldInSection(priorSections?.early));
    const early = oppositeSection(sections.early, sections.earlyTotal, heldInSection(priorSections?.confirmed));
    const heldConfirmed = retain(confirmed.rows, priorSections?.confirmed, momentumLimit, confirmed.total);
    const heldEarly = retain(early.rows, priorSections?.early, momentumLimit, early.total);
    return { confirmed: heldConfirmed.rows, confirmedTotal: heldConfirmed.total,
      early: heldEarly.rows, earlyTotal: heldEarly.total };
  })();

  const declines = current.declines;
  let retainedDeclines = declines;
  if (declines?.controls.enabled) {
    const rapid = retain(declines.rapid, previous.declines?.rapid, declines.controls.displayLimit, declines.rapidTotal);
    const losers = retain(declines.losers, previous.declines?.losers, declines.controls.displayLimit, declines.loserTotal);
    retainedDeclines = { ...declines, rapid: rapid.rows, rapidTotal: rapid.total, losers: losers.rows, loserTotal: losers.total };
  }

  const pullbacks = current.premarketPullbacks;
  const premarketPullbacks = pullbacks?.controls.enabled
    ? { ...pullbacks, ...retain(pullbacks.rows, previous.premarketPullbacks?.rows, pullbacks.controls.displayLimit, pullbacks.total) }
    : pullbacks;
  return { gainers, dayGainers, momentum: { ...momentum, ...(retainedSections ? { momentumSections: retainedSections } : {}) },
    declines: retainedDeclines, premarketPullbacks };
}
