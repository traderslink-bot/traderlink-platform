import { constants } from "node:fs";
import { open } from "node:fs/promises";
import { isAbsolute } from "node:path";
import { setTimeout as delay } from "node:timers/promises";
import { parseCalendarSessions } from "../src/modules/scanner/alpaca/chart-calendar";
import { easternClock } from "../src/modules/scanner/live/sessions";
import type { ScreenerProviderSelection } from "../src/modules/stock-screeners/contracts";
import { ScreenerProviderTransport } from "../src/modules/stock-screeners/provider-transport";
import { ScreenerSnapshotCollector } from "../src/modules/stock-screeners/provider-snapshot-collector";
import { runScreenerProviderWorker } from "../src/modules/stock-screeners/provider-worker";
import { runMoomooScreenerSession } from "../src/modules/stock-screeners/moomoo-live-worker";
import { runLiveScreenerSession } from "../src/modules/stock-screeners/live-market-worker";
import { LiveScreenerPublisher } from "../src/modules/stock-screeners/live-screener-publisher";
import type { LiveScreenerWindow } from "../src/modules/stock-screeners/live-screener-book";
import { sessionBounds } from "../src/modules/stock-screeners/market-metrics";

async function privateConfiguration(path: string) {
  if (!isAbsolute(path)) throw Error("invalid_worker_configuration");
  const handle = await open(path, constants.O_RDONLY | constants.O_NOFOLLOW);
  try {
    const info = await handle.stat();
    if (!info.isFile() || (info.mode & 0o077) || info.size > 4096) throw Error("invalid_worker_configuration");
    return JSON.parse(await handle.readFile("utf8")) as Record<string, string>;
  } finally {
    await handle.close();
  }
}

async function runSelection(settings: Record<string, string>, transport: ScreenerProviderTransport,
  selection: ScreenerProviderSelection, signal: AbortSignal) {
  let credentials: { keyId: string; secretKey: string } | undefined;
  let environment: NodeJS.ProcessEnv = { NODE_ENV: "development" };
  if (selection.provider === "alpaca") {
    const secret = await privateConfiguration(settings.credentialsFile);
    if (!secret.keyId || !secret.secretKey) throw Error("invalid_worker_configuration");
    credentials = { keyId: secret.keyId, secretKey: secret.secretKey };
    const gateway = await privateConfiguration(settings.gatewayTokenFile);
    if (!gateway.token || gateway.token.length < 32 || !settings.gatewayUrl) throw Error("invalid_worker_configuration");
    environment = { NODE_ENV: "development", TRADERLINK_ALPACA_GATEWAY_URL: settings.gatewayUrl,
      TRADERLINK_ALPACA_GATEWAY_TOKEN: gateway.token };
  }
  const collector = new ScreenerSnapshotCollector(transport, selection, signal, credentials);
  async function snapshots() {
    while (!signal.aborted) {
      const started = Date.now();
      try {
        const pack = await collector.collect();
        await transport.publish(pack, selection, signal);
      } catch {
        if (!signal.aborted) console.warn("screeners_snapshot_unavailable", selection.provider);
      }
      const clock = easternClock(Date.now());
      const weekday = new Date(clock.date + "T12:00:00Z").getUTCDay();
      const active = weekday > 0 && weekday < 6 && clock.minute >= 235 && clock.minute < 1210;
      const intervalMs = active ? 300_000 : 1_800_000;
      await delay(Math.max(20_000, intervalMs - (Date.now() - started)), undefined, { signal }).catch(() => {});
    }
  }
  async function live() {
    while (!signal.aborted) {
      try {
        const reference = await collector.referenceData();
        const date = easternClock(Date.now()).date;
        const startDate = new Date(Date.now() - 540 * 86_400_000).toISOString().slice(0, 10);
        const endDate = new Date(Date.now() + 3 * 86_400_000).toISOString().slice(0, 10);
        const days = parseCalendarSessions(reference.calendar, startDate, endDate);
        const day = days.find(row => row.date === date);
        const session = day && (["premarket", "regular", "after_hours"] as const).find(phase => {
          const bounds = sessionBounds(day, phase);
          return Date.now() >= bounds.from && Date.now() < bounds.until;
        });
        if (day && session) {
          const { from: start, until: end } = sessionBounds(day, session);
          const window: LiveScreenerWindow = { session, start, end };
          const symbols = reference.listings.stocks.map(row => row.symbol);
          let nextPublishWarning = 0;
          const publisher = new LiveScreenerPublisher({ origin: settings.origin, token: settings.publishToken,
            window, signal, selection, onError: () => {
              if (Date.now() < nextPublishWarning) return;
              nextPublishWarning = Date.now() + 60_000;
              console.warn("screeners_live_publish_failed", selection.provider);
            } });
          try {
            if (selection.provider === "alpaca") {
              await runLiveScreenerSession({ symbols, start, end, credentials: credentials!, environment, signal,
                publish: rows => publisher.offer(rows), onState(state) {
                  if (state === "warming") publisher.start();
                  if (state === "disconnected") publisher.clear();
                } });
            } else {
              let initial = true;
              await runMoomooScreenerSession({ symbols, window, signal,
                spacingMs: reference.spacingMs,
                universe: async () => {
                  const current = await collector.referenceData();
                  return { symbols: current.listings.stocks.map(stock => stock.symbol), spacingMs: current.spacingMs! };
                },
                read: batch => transport.moomoo(selection, { operation: "snapshots", symbols: batch }, signal),
                observe: (payload, batch) => collector.observeMoomooSnapshots(payload, batch),
                completedPass: async () => {
                  if (!initial) return;
                  try {
                    await transport.publish(await collector.initialMoomooPack(), selection, signal, true);
                    initial = false;
                  } catch { if (!signal.aborted) console.warn("screeners_initial_quotes_unavailable"); }
                },
                publish: rows => { publisher.offer(rows); },
                connected: () => publisher.start(), disconnected: () => publisher.clear() });
            }
          } finally { publisher.clear(); }
        }
      } catch {
        if (!signal.aborted) console.warn("screeners_live_session_unavailable", selection.provider);
      }
      await delay(5_000, undefined, { signal }).catch(() => {});
    }
  }
  await Promise.all([snapshots(), live()]);
}

async function main() {
  if (process.argv.length !== 3) throw Error("invalid_worker_configuration");
  const settings = await privateConfiguration(process.argv[2]);
  const transport = new ScreenerProviderTransport(settings.origin, settings.publishToken);
  const stop = new AbortController();
  process.once("SIGINT", () => stop.abort());
  process.once("SIGTERM", () => stop.abort());
  await runScreenerProviderWorker({ signal: stop.signal, selection: signal => transport.selection(signal),
    run: (selection, signal) => runSelection(settings, transport, selection, signal),
    onError: () => console.warn("screeners_provider_worker_unavailable") });
}

void main().catch(() => { console.error("Live Screeners worker configuration is incomplete."); process.exitCode = 1; });
