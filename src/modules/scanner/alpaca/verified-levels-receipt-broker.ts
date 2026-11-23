import type { AcceptedInput, AcceptedRegularMapBinding, AcceptedSeriesPublisher } from "../../market-data/accepted-series/publisher";
import { encodeGatewayWire } from "../../market-data/transport/gateway-wire";
import { ALPACA_NATIVE_DAILY_DATASET, ALPACA_REGULAR_FOUR_HOUR_DATASET, exactHistoryAcceptance } from "./rest-data";
import { prepareVerifiedAlpacaRegularHistory, qualifyAlpacaNativeDailyHistory,
  verifyAlpacaRegularFourHourCoverage } from "./verify-regular-history";
import { nativeDailyScannerContext } from "./native-daily-scanner-context";

type Window = Parameters<typeof prepareVerifiedAlpacaRegularHistory>[1];
type Basis = Parameters<typeof prepareVerifiedAlpacaRegularHistory>[2];
type CapturedHistory = Readonly<{
  operationId: string;
  requestId: string;
  kind: "daily" | "4h";
  symbol: string;
  startMs: number;
  endMs: number;
  wire: boolean;
}>;

export type ObservedScannerLevelsHistory = Readonly<{
  request: CapturedHistory;
  window: Window;
  basis: Basis;
}>;

export type SavedScannerLevelsReceiptWindow = Readonly<{
  savedAfterMs: number;
  dailyId: string;
  regularId: string;
  previousId: string;
}>;

/** Binds already observed provider facts to the generator's exact pending request. */
function prepare(observed: ObservedScannerLevelsHistory) {
  const { request: captured, basis, window } = observed;
  if (captured.kind === "4h") {
    const request = { symbol: captured.symbol, start: captured.startMs, end: captured.endMs,
      timeframe: "4Hour", sessionMode: "regular", acceptedEvidence: true } as const;
    const verified = prepareVerifiedAlpacaRegularHistory(request, window, basis);
    return verified && { request, ...verified };
  }
  const request = { symbol: captured.symbol, start: captured.startMs, end: captured.endMs,
    timeframe: "1Day", acceptedEvidence: true } as const;
  const qualified = qualifyAlpacaNativeDailyHistory(request, window, basis);
  if (!qualified) return;
  const calendars = "available" in window.calendar ? [window.calendar] : [...window.calendar];
  return { request, history: window.split, qualified, calendars };
}

/**
 * One issuer for delivery and later accepted-input reads. It never obtains credentials or invents a
 * time, listing, price basis or calendar revision. The admitted broker supplies those observations.
 */
export function createVerifiedLevelsReceiptBroker(publisher: AcceptedSeriesPublisher) {
  function reply(observed: ObservedScannerLevelsHistory, { history, calendars }: NonNullable<ReturnType<typeof prepare>>, acceptedInput: AcceptedInput) {
    const payload = { ...history, calendars, acceptedInput };
    return {
      operationId: observed.request.operationId, requestId: observed.request.requestId, status: 200,
      body: JSON.stringify(observed.request.wire ? encodeGatewayWire("history", payload) : payload),
    };
  }

  function issueRegularObservation(observed: ObservedScannerLevelsHistory, saved: SavedScannerLevelsReceiptWindow,
    signal: AbortSignal, afterSave: boolean, binding?: AcceptedRegularMapBinding, verifiedEmptyStarts?: readonly number[]) {
    if (signal.aborted || observed.request.kind !== "4h" || !observed.request.operationId || !observed.request.requestId ||
      !Number.isSafeInteger(saved.savedAfterMs) || saved.savedAfterMs <= 0 ||
      (observed.request.startMs > saved.savedAfterMs) !== afterSave ||
      observed.request.endMs - observed.request.startMs !== 14_400_000) return;
    const daily = publisher.read(saved.dailyId);
    const regular = publisher.read(saved.regularId);
    const previous = publisher.latestFullCandle(saved.previousId);
    if (daily?.datasetId !== ALPACA_NATIVE_DAILY_DATASET || regular?.datasetId !== ALPACA_REGULAR_FOUR_HOUR_DATASET ||
      previous?.input.datasetId !== ALPACA_REGULAR_FOUR_HOUR_DATASET ||
      Math.max(daily.acceptedAtMs, regular.acceptedAtMs) > saved.savedAfterMs ||
      (afterSave && previous.input.acceptedAtMs >= observed.request.startMs) || previous.row[1] > observed.request.startMs) return;
    const { basis } = observed;
    if ([daily, regular, previous.input].some(input => input.symbol !== basis.symbol ||
      input.instrumentId !== basis.instrumentId || input.venue !== basis.venue ||
      input.priceBasisId !== basis.priceBasisId || input.calendarRevision !== basis.calendarRevision)) return;
    const verified = prepare(observed);
    if (signal.aborted) return;
    if (!verified) {
      const { request, window } = observed;
      if (request.symbol !== basis.symbol || window.symbol !== basis.symbol || request.startMs !== window.startMs ||
        request.endMs !== window.endMs || !Number.isSafeInteger(basis.availableAtMs) ||
        !Number.isSafeInteger(basis.acceptedCutoffMs) ||
        request.endMs > Math.min(basis.availableAtMs, basis.acceptedCutoffMs)) return;
      const coverage = verifyAlpacaRegularFourHourCoverage(window);
      const bucket = coverage?.coverage[0];
      if (coverage?.rows.length === 0 && coverage.coverage.length === 1 && bucket?.emittedMinutes === 0 &&
        bucket.startMs === request.startMs && bucket.endMs === request.endMs) return { state: "empty" as const };
      return;
    }
    const [row] = verified.qualified.rows;
    if (verified.qualified.rows.length !== 1 || row[0] !== observed.request.startMs || row[1] !== observed.request.endMs) return;
    const exact = exactHistoryAcceptance(verified.request, verified.history, verified.qualified);
    if (!exact || signal.aborted) return;
    const input = publisher.publishRetaining(exact, [saved.dailyId, saved.regularId, saved.previousId]);
    if (input) {
      const { dailyId, regularId, previousId, savedAfterMs } = saved;
      if (binding) publisher.recordRegularOpportunity({ ...binding, dailyId, regularId, previousId, savedAfterMs, triggerId: input.id,
        ...(verifiedEmptyStarts?.length ? { verifiedEmptyStarts } : {}),
        startMs: observed.request.startMs, calendars: verified.calendars });
      return { state: "candle" as const, input, reply: reply(observed, verified, input) };
    }
  }

  return {
    issueMapHistory(daily: ObservedScannerLevelsHistory, fourHour: ObservedScannerLevelsHistory, signal: AbortSignal) {
      if (signal.aborted || daily.request.kind !== "daily" || fourHour.request.kind !== "4h" ||
        !daily.request.operationId || daily.request.operationId !== fourHour.request.operationId ||
        !daily.request.requestId || !fourHour.request.requestId || daily.request.requestId === fourHour.request.requestId ||
        daily.request.wire !== fourHour.request.wire ||
        daily.basis.symbol !== fourHour.basis.symbol || daily.basis.instrumentId !== fourHour.basis.instrumentId ||
        daily.basis.venue !== fourHour.basis.venue || daily.basis.priceBasisId !== fourHour.basis.priceBasisId ||
        daily.basis.calendarRevision !== fourHour.basis.calendarRevision) return;
      const day = prepare(daily);
      const intraday = prepare(fourHour);
      if (!day || !intraday || signal.aborted) return;
      const dailyInput = exactHistoryAcceptance(day.request, day.history, day.qualified);
      const regularInput = exactHistoryAcceptance(intraday.request, intraday.history, intraday.qualified);
      if (!dailyInput || !regularInput) return;
      const longerTerm = nativeDailyScannerContext(dailyInput, day.calendars);
      const inputs = publisher.publishPair(dailyInput, regularInput, longerTerm);
      if (inputs) {
        publisher.rememberRegularCalendar(inputs[1].id, intraday.calendars);
        return { daily: reply(daily, day, inputs[0]), fourHour: reply(fourHour, intraday, inputs[1]), inputs, longerTerm };
      }
    },
    issueLaterRegularHistory(observed: ObservedScannerLevelsHistory, saved: SavedScannerLevelsReceiptWindow, signal: AbortSignal,
      binding?: AcceptedRegularMapBinding) {
      const result = issueRegularObservation(observed, saved, signal, true, binding);
      return result?.state === "candle" ? { input: result.input, reply: result.reply } : undefined;
    },
    observeRegularHistory(observed: ObservedScannerLevelsHistory, saved: SavedScannerLevelsReceiptWindow,
      signal: AbortSignal, afterSave: boolean, binding: AcceptedRegularMapBinding, verifiedEmptyStarts: readonly number[]) {
      return issueRegularObservation(observed, saved, signal, afterSave, afterSave ? binding : undefined, verifiedEmptyStarts);
    },
  };
}
