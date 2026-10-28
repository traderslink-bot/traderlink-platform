import { isPrivateWatchlistTicker } from "../access/watchlist-analysis-visibility";
import "server-only";
import { createHash } from "node:crypto";
import type Database from "better-sqlite3";
import { calculateManualLoss, type ManualLossDraft } from "@/src/lib/live-watchlist/manual-loss-card";

export const GAIN_CHANNEL = "1433570741068234795";
export const GAIN_MAX_BYTES = 4 * 1024 * 1024;
export function validateGainPost(value: { symbol: string; requestId: string; message: string; png: Uint8Array }) {
  const { symbol, requestId, message, png } = value;
  if (!/^[A-Z][A-Z0-9]{0,9}(?:[.-][A-Z0-9]{1,2})?$/.test(symbol) ||
    !/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(requestId) || message.length > 1800) throw Error("Invalid post.");
  const bytes = Buffer.from(png);
  if (bytes.length < 33 || bytes.length > GAIN_MAX_BYTES || bytes.subarray(0,8).toString("hex") !== "89504e470d0a1a0a" || bytes.toString("ascii",12,16) !== "IHDR") throw Error("Invalid card image.");
  const width = bytes.readUInt32BE(16), height = bytes.readUInt32BE(20);
  if (width < 100 || height < 100 || width > 3200 || height > 4800 || width * height > 8_000_000) throw Error("Invalid card dimensions.");
}
export function potentialGainWebhook(environment = process.env): URL | null {
  try {
    const url = new URL(environment.WATCHLIST_POTENTIAL_GAIN_DISCORD_WEBHOOK_URL ?? "");
    return url.origin === "https://discord.com" && /^\/api\/webhooks\/\d+\/[A-Za-z0-9_-]+$/.test(url.pathname) && !url.username && !url.password && !url.search && !url.hash ? url : null;
  } catch { return null; }
}
type Receipt = { owner_user_id: string; payload_hash: string; state: string; retry_at_ms: number };
const receiptResult = (state: string, retryAt = 0) => ({ state, retryAt,
  message: state === "sent" ? "Posted to Discord." : state === "retry" ? "Discord asked us to wait. Try Send to Discord again after the wait shown." : state === "failed" ? "Discord did not accept the post. Close and reopen to try again." : "Delivery could not be confirmed. Check Discord before posting again." });

type CardPostInput = { ownerUserId: string; symbol: string; requestId: string; message: string; png: Uint8Array };
export async function sendPotentialGainPost(database: Database.Database, input: CardPostInput, transport: typeof fetch = fetch, environment = process.env) {
  return sendCardPost(database, input, transport, environment);
}

export async function sendManualLossPost(database: Database.Database, input: CardPostInput & ManualLossDraft, transport: typeof fetch = fetch, environment = process.env) {
  const loss = calculateManualLoss(input);
  return sendCardPost(database, input, transport, environment, { kind: "loss", payload: JSON.stringify(loss) });
}

async function sendCardPost(database: Database.Database, input: CardPostInput, transport: typeof fetch, environment: NodeJS.ProcessEnv, loss?: { kind: "loss"; payload: string }) {
  if(isPrivateWatchlistTicker(input.symbol))throw Error("Move this ticker out of Private before publishing.");
  validateGainPost(input);
  const digest = createHash("sha256").update(input.symbol).update("\0").update(input.message).update("\0").update(input.png);
  // Preserve existing Gain receipt hashes exactly; Loss binds its distinct kind/manual facts too.
  if (loss) digest.update("\0manual-loss\0").update(loss.payload);
  const hash = digest.digest("hex");
  const filename = `${input.symbol}-${loss ? "trade-loss" : "potential-gain"}.png`;
  const description = `${input.symbol} ${loss ? "trade loss" : "potential gain"} card`;
  const channelLabel = loss ? "gain/loss" : "potential gain";
  const existing = database.prepare<[string],Receipt>("SELECT * FROM platform_watchlist_potential_gain_posts WHERE request_id=?").get(input.requestId);
  if (existing) {
    if (existing.owner_user_id !== input.ownerUserId || existing.payload_hash !== hash) throw Error("This post request changed. Reopen the preview.");
    if (existing.state !== "retry" || existing.retry_at_ms > Date.now()) return receiptResult(existing.state, existing.retry_at_ms);
  }
  const webhook = potentialGainWebhook(environment);
  if (!webhook) return { state: "unconfigured", message: `The ${channelLabel} Discord channel is not configured yet.` };
  // Validate destination before claiming any delivery. No owner content is sent here.
  try {
    const metadata = await transport(webhook, { signal: AbortSignal.timeout(8000), redirect: "error" });
    if (!metadata.ok || (await metadata.json()).channel_id !== GAIN_CHANNEL) return { state: "configuration", message: `The configured webhook could not be verified for the ${channelLabel} channel.` };
  } catch { return { state: "configuration", message: `The ${channelLabel} Discord connection could not be verified. Try again.` }; }
  const claimed = database.transaction(() => {
    const previous = database.prepare<[string],Receipt>("SELECT * FROM platform_watchlist_potential_gain_posts WHERE request_id=?").get(input.requestId);
    if (previous) {
      if (previous.owner_user_id !== input.ownerUserId || previous.payload_hash !== hash) throw Error("This post request changed. Reopen the preview.");
      if (previous.state !== "retry" || previous.retry_at_ms > Date.now()) return receiptResult(previous.state, previous.retry_at_ms);
      database.prepare("UPDATE platform_watchlist_potential_gain_posts SET state='sending',updated_at_utc=? WHERE request_id=?").run(new Date().toISOString(),input.requestId);
    } else {
      const now = new Date().toISOString();
      database.prepare("INSERT INTO platform_watchlist_potential_gain_posts(request_id,owner_user_id,ticker,payload_hash,state,created_at_utc,updated_at_utc) VALUES(?,?,?,?,'sending',?,?)")
        .run(input.requestId,input.ownerUserId,input.symbol,hash,now,now);
    }
    return null;
  }).immediate();
  if (claimed) return claimed;
  let state = "uncertain", retryAt = 0, messageId: string | null = null;
  try {
    webhook.searchParams.set("wait", "true");
    const form = new FormData();
    form.set("payload_json", JSON.stringify({ content: input.message ? `${input.message}\n\n@everyone` : "@everyone", allowed_mentions: { parse: ["everyone"] }, attachments: [{ id: 0, filename, description }] }));
    form.set("files[0]", new Blob([new Uint8Array(input.png)], { type: "image/png" }), filename);
    const response = await transport(webhook, { method: "POST", body: form, signal: AbortSignal.timeout(20000), redirect: "error" });
    if (response.ok) {
      const result = await response.json();
      if (typeof result.id === "string" && /^\d+$/.test(result.id)) { state = "sent"; messageId = result.id; }
    } else if (response.status === 429) {
      const result = await response.json().catch(() => ({}));
      const seconds = Number(result.retry_after ?? response.headers.get("retry-after") ?? 60);
      retryAt = Date.now() + Math.max(1000, (Number.isFinite(seconds) ? seconds : 60) * 1000); state = "retry";
    } else if (response.status >= 400 && response.status < 500 && response.status !== 408) state = "failed";
  } catch { /* No transport error or credential is returned to the owner or logs. */ }
  database.prepare("UPDATE platform_watchlist_potential_gain_posts SET state=?,retry_at_ms=?,discord_message_id=?,updated_at_utc=? WHERE request_id=?")
    .run(state,retryAt,messageId,new Date().toISOString(),input.requestId);
  return receiptResult(state,retryAt);
}
