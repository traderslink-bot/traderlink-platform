import "server-only";
import { parseChartCorrection } from "@/src/modules/scanner/alpaca/chart-correction";
import { calendarDate } from "@/src/modules/scanner/alpaca/chart-calendar";
import { browserCandle } from "./browser-chart-history";

type RecordValue = Record<string, unknown>;
const record = (value: unknown): RecordValue => value && typeof value === "object" && !Array.isArray(value) ? value as RecordValue : {};
const pick = (value: RecordValue, keys: readonly string[]) => Object.fromEntries(keys.filter(key => key in value).map(key => [key, value[key]]));
const states = new Set(["connecting", "connected", "reconnecting", "unavailable", "closed"]);
const connectionFailure = { type: "status", data: { state: "unavailable" } };

/** Keep stream facts, clocks and halt state; upstream errors are never a public protocol. */
export function browserChartEvent(type: string, input: unknown): { type: string; data: RecordValue } {
  const data = record(input);
  if (type === "status" || type === "overnight-status") return { type, data: {
    state: states.has(String(data.state)) ? data.state : "unavailable",
    ...(data.adjustment === "split" || data.adjustment === "raw" ? { adjustment: data.adjustment } : {}),
    ...(calendarDate(data.basisDate) ? { basisDate: data.basisDate } : {}),
  } };
  if (type === "price" || type === "overnight-price") return typeof data.price === "number" && Number.isFinite(data.price)
    && typeof data.time === "string" && Number.isFinite(Date.parse(data.time)) ? { type, data: { price: data.price, time: data.time } } : connectionFailure;
  if (type === "bar" || type === "overnight-bar") {
    if (typeof data.daily !== "boolean" || data.provisional !== undefined && typeof data.provisional !== "boolean") return connectionFailure;
    try { return { type, data: { ...pick(data, ["daily", "provisional"]),
      ...(data.adjustment === "split" || data.adjustment === "raw" ? { adjustment: data.adjustment } : {}),
      ...(calendarDate(data.basisDate) ? { basisDate: data.basisDate } : {}), bar: browserCandle(data.bar),
    } }; } catch { return connectionFailure; }
  }
  if (type === "chart-correction") {
    try { return { type, data: parseChartCorrection(data) }; } catch { return connectionFailure; }
  }
  if (type === "trading-status") {
    const status = record(data.status);
    const fields = ["symbol", "haltedAt", "observedAt", "statusCode", "reasonCode", "reason", "tape", "quoteResumedAt", "tradeResumedAt", "pauseObservedAt"];
    if (typeof data.symbol !== "string" || typeof data.available !== "boolean") return connectionFailure;
    if (data.status === null) return { type, data: { symbol: data.symbol, available: data.available, status: null } };
    if (typeof status.halted !== "boolean" || !fields.every(key => status[key] === undefined || status[key] === null || typeof status[key] === "string")) return connectionFailure;
    return { type, data: { symbol: data.symbol, available: data.available, status: { ...pick(status, fields), halted: status.halted } } };
  }
  return connectionFailure;
}

/** Bounded incremental SSE decoding; no extra connection, timer or queued history. */
export class BrowserChartFrames {
  private decoder = new TextDecoder();
  private encoder = new TextEncoder();
  private pending = "";
  constructor(
    private readonly parseEvent = browserChartEvent,
    private readonly maxFrameLength = 128_000,
  ) {}
  write(chunk: Uint8Array): Uint8Array {
    this.pending = (this.pending + this.decoder.decode(chunk, { stream: true })).replace(/\r\n/g, "\n");
    let output = "", boundary: number;
    while ((boundary = this.pending.indexOf("\n\n")) >= 0) {
      if (boundary > this.maxFrameLength) throw Error("chart_frame_too_large");
      const frame = this.pending.slice(0, boundary); this.pending = this.pending.slice(boundary + 2);
      const lines = frame.split("\n"), values = lines.filter(line => line.startsWith("data:")).map(line => line.slice(5).trimStart());
      if (!values.length) {
        if (lines.some(line => line.startsWith(":"))) output += ": heartbeat\n\n";
        const retry = lines.find(line => /^retry: ?\d{1,5}$/.test(line)); if (retry) output += retry + "\n\n";
        continue;
      }
      let event: ReturnType<typeof browserChartEvent> = connectionFailure;
      try { event = this.parseEvent(lines.find(line => line.startsWith("event:"))?.slice(6).trim() ?? "message", JSON.parse(values.join("\n"))); }
      catch { /* Malformed upstream data has the same public connection failure. */ }
      output += `event: ${event.type}\ndata: ${JSON.stringify(event.data)}\n\n`;
    }
    if (this.pending.length > this.maxFrameLength) throw Error("chart_frame_too_large");
    return this.encoder.encode(output);
  }
}
