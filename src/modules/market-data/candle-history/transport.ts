import { chartSymbol, type Candle } from "../../scanner/alpaca/candles";
import { CANDLE_HISTORY_FRAMES, type CandleHistorySettings, type HistoryFrame } from "./settings";

export type CandleArchiveRead = {
  symbol: string;
  frame: HistoryFrame;
  session: "regular" | "extended" | "daily";
  start: number;
  end: number;
};
export type CandleArchiveReply = { state: "miss" } | {
  state: "ready"; bars: Candle[]; start: number; end: number; basisDate: string;
};
export type CandleArchiveTotals = { symbols: number; bars: number; estimatedBytes: number };
export type CandleArchiveAdmin = {
  settings: CandleHistorySettings;
  minuteState: "off" | "connecting" | "active";
  backfill?: { total: number; complete: number; retrying: number };
  storage: {
  measuredAt: number;
  marketCap: CandleArchiveTotals;
  popular: CandleArchiveTotals;
  overlap: CandleArchiveTotals;
  combined: CandleArchiveTotals;
  physicalBytes: number;
  };
};

export type CandleHistoryProjection = {
  marketCap: number; popular: number; overlap: number; combined: number; estimatedBytes: number;
};

export function parseArchiveRead(query: URLSearchParams): CandleArchiveRead {
  const symbol = chartSymbol(query.get("symbol") ?? "");
  const frame = query.get("frame") as HistoryFrame;
  const session = query.get("session");
  const start = Number(query.get("start"));
  const end = Number(query.get("end"));
  if (!CANDLE_HISTORY_FRAMES.includes(frame) ||
    (session !== "regular" && session !== "extended" && session !== "daily") ||
    (frame === "1D") !== (session === "daily") ||
    !Number.isSafeInteger(start) || !Number.isSafeInteger(end) ||
    start <= 0 || end <= start || end > Date.now() / 1_000 + 60 ||
    end - start > (frame === "1D" ? 3_660 : 120) * 86_400) throw Error("invalid_archive_query");
  return { symbol, frame, session, start, end };
}
