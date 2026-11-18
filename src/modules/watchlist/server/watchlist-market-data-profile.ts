import "server-only";
import { readSharedMoomooConnectionStatus } from "./moomoo-watchlist-candle-bridge";
import { changeMarketDataProvider, marketDataSelection } from "@/src/modules/market-data/server/provider-settings";
import { requestWatchlistRuntimeRaw } from "./runtime/watchlist-runtime-admin-client";

export type WatchlistMarketDataProfile = "alpaca" | "previous";
const roles = {
  alpaca: { historicalProvider: "alpaca", liveProvider: "alpaca", sameDayCandleProvider: "alpaca" },
  previous: { historicalProvider: "eodhd", liveProvider: "eodhd", sameDayCandleProvider: "moomoo" },
} as const;
type ProfileStatus = { profile: WatchlistMarketDataProfile | null; revision: number;
  roles: { historicalProvider: string; liveProvider: string; sameDayCandleProvider: string }; persisted?: boolean; changing: boolean };
const globals = globalThis as typeof globalThis & { __watchlistProfileChange?: boolean };
function parseStatus(body: string): ProfileStatus {
  const value = JSON.parse(body) as ProfileStatus;
  if (!value || !Number.isSafeInteger(value.revision) || value.revision < 0 || typeof value.changing !== "boolean"
    || !value.roles || !["historicalProvider", "liveProvider", "sameDayCandleProvider"].every(key => typeof value.roles[key as keyof ProfileStatus["roles"]] === "string")) {
    throw Error("Watchlist provider status is unavailable.");
  }
  if (value.persisted !== undefined && typeof value.persisted !== "boolean") throw Error("Invalid Watchlist persistence status.");
  if (!["alpaca", "eodhd", "ibkr"].includes(value.roles.historicalProvider)
    || !["alpaca", "eodhd", "ibkr", "moomoo"].includes(value.roles.liveProvider)
    || !["alpaca", "moomoo", "yahoo"].includes(value.roles.sameDayCandleProvider)) throw Error("Invalid Watchlist provider sources.");
  if (value.profile !== null && (value.profile !== "alpaca" && value.profile !== "previous"
    || Object.keys(roles[value.profile]).some(key => value.roles[key as keyof ProfileStatus["roles"]] !== roles[value.profile!][key as keyof ProfileStatus["roles"]]))) {
    throw Error("Watchlist provider status does not match its recorded sources.");
  }
  return { profile: value.profile, revision: value.revision, roles: value.roles, persisted: value.persisted ?? true, changing: value.changing };
}
async function runtimeStatus(environment: NodeJS.ProcessEnv): Promise<ProfileStatus> {
  const response = await requestWatchlistRuntimeRaw({ method: "GET", path: "/api/runtime/market-data-profile", timeoutMs: 15000 }, environment);
  if (!response.ok) throw Error("Watchlist provider status is unavailable.");
  return parseStatus(response.body);
}
function projection(status: ProfileStatus, environment: NodeJS.ProcessEnv) {
  const selected = marketDataSelection("watchlist", environment);
  return { ...status, selectionRevision: selected.revision, synchronized: !status.changing && status.persisted !== false && status.profile !== null
    && selected.provider === (status.profile === "alpaca" ? "alpaca" : "moomoo") };
}
/** Read-only. An incomplete pair is reported; reading never changes either service. */
export async function readWatchlistMarketDataProfile(environment: NodeJS.ProcessEnv = process.env) {
  return projection(await runtimeStatus(environment), environment);
}
/** Runtime is the durable role authority; Platform acknowledges only a verified complete pair. */
export async function changeWatchlistMarketDataProfile(profile: WatchlistMarketDataProfile, expectedRevision: number,
  environment: NodeJS.ProcessEnv = process.env) {
  if (profile !== "alpaca" && profile !== "previous" || !Number.isSafeInteger(expectedRevision) || expectedRevision < 0) throw Error("Invalid Watchlist provider selection.");
  if (profile === "previous" && !readSharedMoomooConnectionStatus(environment).ready) throw Error("The shared Moomoo quote connection is unavailable.");
  if (globals.__watchlistProfileChange) throw Error("Watchlist provider selection is already in progress.");
  globals.__watchlistProfileChange = true;
  try {
    // A lost acknowledgment is reconciled by GET, never by repeating a mutation.
    let status: ProfileStatus;
    const response = await requestWatchlistRuntimeRaw({ method: "POST", path: "/api/runtime/market-data-profile",
      body: JSON.stringify({ profile, expectedRevision }), contentType: "application/json", timeoutMs: 90000 }, environment);
    if (response.ok) status = parseStatus(response.body);
    else status = await runtimeStatus(environment);
    if (status.profile !== profile || status.changing || status.persisted === false || status.revision < expectedRevision) {
      throw Error("Watchlist provider change did not complete. Reload its current status.");
    }
    const selected = marketDataSelection("watchlist", environment);
    const provider = profile === "alpaca" ? "alpaca" : "moomoo";
    if (selected.provider !== provider) await changeMarketDataProvider("watchlist", selected.revision, provider, environment);
    // Covers an intervening legacy Runtime control or an interrupted prior pair.
    const confirmed = projection(await runtimeStatus(environment), environment);
    if (confirmed.profile !== profile || confirmed.revision !== status.revision || !confirmed.synchronized) {
      throw Error("Watchlist sources changed before confirmation. Reload their current status.");
    }
    return confirmed;
  } finally { globals.__watchlistProfileChange = false; }
}
