import { constants } from "node:fs";
import { open } from "node:fs/promises";
import { isAbsolute } from "node:path";
import { setTimeout as delay } from "node:timers/promises";
import { AlpacaChartCalendar } from "../src/modules/scanner/alpaca/chart-calendar-provider";
import { easternClock } from "../src/modules/scanner/live/sessions";
import { collectListings } from "../src/modules/stock-screeners/listings";
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

async function main() {
  if (process.argv.length !== 3) throw Error("invalid_worker_configuration");
  const settings = await privateConfiguration(process.argv[2]);
  if (!settings.origin || !settings.publishToken || settings.publishToken.length < 32) throw Error("invalid_worker_configuration");
  const secret = await privateConfiguration(settings.credentialsFile);
  if (!secret.keyId || !secret.secretKey) throw Error("invalid_worker_configuration");
  const credentials = { keyId: secret.keyId, secretKey: secret.secretKey };
  const gateway = await privateConfiguration(settings.gatewayTokenFile);
  if (!gateway.token || gateway.token.length < 32 || !settings.gatewayUrl) throw Error("invalid_worker_configuration");
  const env: NodeJS.ProcessEnv = { NODE_ENV: "development",
    TRADERLINK_ALPACA_GATEWAY_URL: settings.gatewayUrl, TRADERLINK_ALPACA_GATEWAY_TOKEN: gateway.token };
  const calendar = new AlpacaChartCalendar(credentials);
  const stop = new AbortController();
  const abort = () => stop.abort();
  process.once("SIGINT", abort);
  process.once("SIGTERM", abort);
  let roster: { date: string; symbols: string[] } | undefined;
  while (!stop.signal.aborted) {
    const date = easternClock(Date.now()).date;
    try {
      const schedule = await calendar.forYear(Number(date.slice(0, 4)));
      const day = schedule.available ? schedule.sessions.find(row => row.date === date) : undefined;
      const session = day && (["premarket", "regular", "after_hours"] as const).find(phase => {
        const { from, until } = sessionBounds(day, phase);
        return Date.now() >= from && Date.now() < until;
      });
      if (day && session) {
        if (roster?.date !== date) {
          const listing = await collectListings({ "APCA-API-KEY-ID": credentials.keyId, "APCA-API-SECRET-KEY": credentials.secretKey });
          roster = { date, symbols: listing.stocks.map(row => row.symbol) };
        }
        const { from: start, until: end } = sessionBounds(day, session);
        const window: LiveScreenerWindow = { session, start, end };
        let nextError = 0;
        const publisher = new LiveScreenerPublisher({ origin: settings.origin, token: settings.publishToken, window, signal: stop.signal,
          onError(status) {
            if (Date.now() < nextError) return;
            nextError = Date.now() + 60_000;
            console.warn("screeners_live_publish_failed", status);
          },
        });
        try {
          await runLiveScreenerSession({ symbols: roster.symbols, start, end, credentials, environment: env, signal: stop.signal,
            publish: rows => publisher.offer(rows),
            onState(state, covered) {
              if (state === "warming") publisher.start();
              if (state === "disconnected") publisher.clear();
              console.log("screeners_live_state", session, state, covered ?? roster?.symbols.length ?? 0);
            },
          });
        } finally {
          publisher.clear();
        }
      }
    } catch {
      if (!stop.signal.aborted) console.warn("screeners_live_session_unavailable");
    }
    await delay(5_000, undefined, { signal: stop.signal }).catch(() => {});
  }
}

void main().catch(() => { console.error("Live Screeners worker configuration is incomplete."); process.exitCode = 1; });
