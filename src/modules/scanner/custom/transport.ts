import { parseScanDefinition, requiresScannerLevelRead, SAVED_SCAN_ID, scanRules, type ReadScanLevelBreak, type SavedScanBook, type SavedScanResults, type ScanQuery, type ScanResult, type ScanResultColumn } from "./definition";
import type { CustomScanMarket } from "./market";
import { selectedScanResultColumns } from "./result-columns";
import { savedScanCatalogue } from "./saved";
import type { ReadScanPressReleases } from "./signal-filters";

export function parseScanQueries(value: unknown): ScanQuery[] {
  if (!Array.isArray(value) || value.length === 0 || value.length > 24) throw Error("invalid_scan_queries");
  const keys = new Set<string>();
  return value.map(query => {
    if (!query || typeof query !== "object" || typeof query.key !== "string" || !/^[\w-]{1,96}$/.test(query.key) ||
      keys.has(query.key) || !Number.isSafeInteger(query.page) || query.page < 1 || query.page > 10_000 ||
      (query.compact !== undefined && typeof query.compact !== "boolean")) throw Error("invalid_scan_query");
    keys.add(query.key);
    return { key:query.key, definition:parseScanDefinition(query.definition), page:query.page, compact:query.compact === true };
  });
}

export function parseSavedScanIds(value: unknown): string[] {
  if (!value || typeof value !== "object" || Array.isArray(value) || !("ids" in value) || Object.keys(value).length !== 1 ||
    !Array.isArray(value.ids) || value.ids.length < 1 || value.ids.length > 24 ||
    value.ids.some(id => typeof id !== "string" || !SAVED_SCAN_ID.test(id))) throw Error("invalid_saved_scan_ids");
  return [...new Set<string>(value.ids)];
}

const serialized = new WeakMap<ScanResult,{signature:string;payload:string}>();
function serialize(result:ScanResult) {
  const previous = serialized.get(result);
  if (previous) return previous;
  const {updatedAt,...state} = result;
  const signature = JSON.stringify(state);
  const frame = {signature,payload:signature.slice(0,-1) + ',"updatedAt":' + updatedAt + '}'};
  serialized.set(result,frame);
  return frame;
}

export const SWING_DETECTION_INTERVAL_MS = 5 * 60_000;

function scanReader(market: CustomScanMarket, readPress?: ReadScanPressReleases) {
  return (query: ScanQuery, readLevelBreak?: ReadScanLevelBreak) => market.query(query, readPress, readLevelBreak,
    query.definition.cadence === "swing" ? Math.floor(Date.now() / SWING_DETECTION_INTERVAL_MS) : undefined);
}

export function streamCustomScans(market: CustomScanMarket, queries: readonly ScanQuery[], signal: AbortSignal,
  attach?: () => () => void, readPress?: ReadScanPressReleases, decorate?: (result: ScanResult) => ScanResult,
  readLevelBreaks?: () => Promise<ReadScanLevelBreak>, canRead?: () => boolean) {
  const encoder = new TextEncoder();
  let cleanup = () => {};
  let emit = () => {};
  return new ReadableStream<Uint8Array>({
    start(controller) {
      const signatures = new Map<string, string>();
      const read = scanReader(market, readPress);
      const hasLevelRule = queries.some(query => scanRules(query.definition).some(rule => requiresScannerLevelRead(rule.metric)));
      let readLevelBreak: ReadScanLevelBreak | undefined;
      let checkingLevels = false;
      let closed = false;
      let pending = false;
      emit = () => {
        if (closed || signal.aborted || (controller.desiredSize ?? 0) <= 0) return;
        if (canRead && !canRead()) {
          cleanup();
          controller.close();
          return;
        }
        if (!pending) return;
        const update: string[] = [];
        for (const query of queries) {
          const result = read(query, readLevelBreak);
          const {signature,payload} = serialize(decorate ? decorate(result) : result);
          if (signature === signatures.get(query.key)) continue;
          signatures.set(query.key, signature);
          update.push(JSON.stringify(query.key) + ":" + payload);
        }
        pending = false;
        if (update.length) controller.enqueue(encoder.encode("{" + update.join(",") + "}\n"));
      };
      const publish = () => { pending = true; emit(); };
      const release = attach?.();
      const releaseQueries = market.attachQueries(queries);
      const unsubscribe = market.subscribe(publish);
      const refreshLevels = async () => {
        if (closed || signal.aborted || !hasLevelRule || !readLevelBreaks || checkingLevels) return;
        checkingLevels = true;
        try { readLevelBreak = await readLevelBreaks(); }
        catch { readLevelBreak = undefined; }
        finally { checkingLevels = false; }
        if (!closed) publish();
      };
      const heartbeat = setInterval(() => {
        void refreshLevels();
        publish();
        if (!closed && (controller.desiredSize ?? 0) > 0) controller.enqueue(encoder.encode("\n"));
      }, 10_000);
      const abort = () => { cleanup(); controller.close(); };
      cleanup = () => {
        if (closed) return;
        closed = true;
        clearInterval(heartbeat);
        unsubscribe();
        release?.();
        releaseQueries?.();
        signal.removeEventListener("abort", abort);
      };
      signal.addEventListener("abort", abort, { once:true });
      if (signal.aborted) abort();
      else {
        publish();
        void refreshLevels();
      }
    },
    pull() { emit(); },
    cancel() { cleanup(); },
  });
}

export function streamSavedScans({
  market, ids, initialBook, signal, readBook, subscribeBook, close, readPress, readLevelBreaks, projection,
}: {
  market: CustomScanMarket;
  ids: readonly string[];
  initialBook: SavedScanBook;
  signal: AbortSignal;
  /** Returns null when this request no longer has access. */
  readBook: () => SavedScanBook | null;
  subscribeBook: (listener: () => void) => () => void;
  close: () => void;
  readPress?: ReadScanPressReleases;
  readLevelBreaks?: () => Promise<ReadScanLevelBreak>;
  projection?: {
    project(publication: SavedScanResults): unknown;
    subscribe(listener: () => void): () => void;
  };
}) {
  const encoder = new TextEncoder();
  let emit = () => {};
  let cleanup = close;
  return new ReadableStream<Uint8Array>({
    start(controller) {
      const signatures = new Map<string, string>();
      const read = scanReader(market, readPress);
      let queries = new Map<string, ScanQuery>();
      let columns = new Map<string, ScanResultColumn[]>();
      let catalogue = savedScanCatalogue(initialBook);
      let lastRevision = -1;
      let releaseQueries: (() => void) | undefined;
      let stopped = false;
      let readLevelBreak: ReadScanLevelBreak | undefined;
      let checkingLevels = false;
      let pending = false;
      let publication: SavedScanResults | undefined;
      let projectionPending = false;
      let lastProjection = "";

      function install(book: SavedScanBook) {
        releaseQueries?.();
        catalogue = savedScanCatalogue(book);
        const definitions = new Map(book.scans.map(scan => [scan.id, scan.definition]));
        queries = new Map(ids.flatMap(id => {
          const definition = definitions.get(id);
          return definition ? [[id, { key: id, definition, page: 1, compact: true }]] : [];
        }));
        columns = new Map([...queries].map(([id, query]) => [
          id, selectedScanResultColumns(query.definition).map(([, field]) => field),
        ]));
        releaseQueries = market.attachQueries([...queries.values()]);
      }
      const emitProjection = () => {
        if (stopped || signal.aborted || !projectionPending || !projection || !publication || (controller.desiredSize ?? 0) <= 0) return;
        projectionPending = false;
        try {
          const serialized = JSON.stringify(projection.project(publication));
          if (serialized === lastProjection) return;
          lastProjection = serialized;
          controller.enqueue(encoder.encode(serialized + "\n"));
        } catch {
          stop();
        }
      };
      emit = () => {
        if (stopped || signal.aborted || (controller.desiredSize ?? 0) <= 0) return;
        if (!pending) { emitProjection(); return; }
        let changed = lastRevision !== catalogue.revision;
        const results: SavedScanResults["results"] = {};
        for (const id of ids) {
          const query = queries.get(id);
          const result = query ? read(query, readLevelBreak) : undefined;
          const signature = result ? serialize(result).signature : "";
          if (signatures.get(id) !== signature) changed = true;
          signatures.set(id, signature);
          results[id] = result ? { state: "ready", result, columns: columns.get(id) ?? [] } : { state: "unavailable" };
        }
        pending = false;
        if (!changed) { emitProjection(); return; }
        lastRevision = catalogue.revision;
        publication = { ...catalogue, results };
        if (projection) { projectionPending = true; emitProjection(); }
        else controller.enqueue(encoder.encode(JSON.stringify(publication) + "\n"));
      };
      const publish = () => { pending = true; emit(); };
      const stop = () => {
        if (stopped) return;
        cleanup();
        controller.close();
      };
      function refresh() {
        try {
          const current = readBook();
          if (!current) return stop();
          if (current.revision !== catalogue.revision) install(current);
          publish();
          if (readLevelBreaks && !checkingLevels && [...queries.values()].some(query =>
            scanRules(query.definition).some(rule => requiresScannerLevelRead(rule.metric)))) {
            checkingLevels = true;
            void readLevelBreaks().then(reader => { readLevelBreak = reader; }, () => { readLevelBreak = undefined; })
              .finally(() => { checkingLevels = false; if (!stopped) publish(); });
          }
        } catch {
          stop();
        }
      }
      install(initialBook);
      const unsubscribeMarket = market.subscribe(publish);
      const unsubscribeBook = subscribeBook(refresh);
      const unsubscribeProjection = projection?.subscribe(() => { projectionPending = true; emit(); });
      const heartbeat = setInterval(() => {
        if (projection) projectionPending = true;
        refresh();
        if (!stopped && (controller.desiredSize ?? 0) > 0) controller.enqueue(encoder.encode("\n"));
      }, 10_000);
      cleanup = () => {
        if (stopped) return;
        stopped = true;
        clearInterval(heartbeat);
        releaseQueries?.();
        unsubscribeMarket();
        unsubscribeBook();
        unsubscribeProjection?.();
        signal.removeEventListener("abort", stop);
        close();
      };
      signal.addEventListener("abort", stop, { once: true });
      if (signal.aborted) stop();
      else refresh();
    },
    pull() { emit(); },
    cancel() { cleanup(); },
  });
}
