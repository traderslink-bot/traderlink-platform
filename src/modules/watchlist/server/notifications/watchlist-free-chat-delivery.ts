import { isPrivateWatchlistTicker } from "../access/watchlist-analysis-visibility";
import "server-only";

/** Only server-exported, published approvals may be passed to this transport. */
export type FreeChatPublication = {
  symbol: string;
  cycleId: string;
  approvalRevision: number;
  updated: boolean;
  images: { filename: string; description: string; base64: string }[];
};

export type FreeChatDeliveryResult = {
  state: "sent" | "retry" | "failed" | "uncertain";
  message: string;
  retryAt?: number;
  messageId?: string;
};

export function freeChatWebhook(environment = process.env): URL | null {
  try {
    const url = new URL(environment.WATCHLIST_FREE_CHAT_DISCORD_WEBHOOK_URL ?? "");
    return url.origin === "https://discord.com" && /^\/api\/webhooks\/\d+\/[A-Za-z0-9_-]+$/.test(url.pathname)
      && !url.username && !url.password && !url.search && !url.hash ? url : null;
  } catch { return null; }
}

export function freeChatPayload(publication: FreeChatPublication) {
  if (!/^[A-Z][A-Z0-9]{0,9}(?:[.-][A-Z0-9]{1,2})?$/.test(publication.symbol)
    || !publication.cycleId || !Number.isSafeInteger(publication.approvalRevision)
    || publication.approvalRevision < 1 || publication.images.length > 4) throw Error("Invalid approved analysis.");
  const symbol = publication.symbol;
  const images = publication.images.map((image, index) => {
    const bytes = Buffer.from(image.base64, "base64");
    if (bytes.length < 33 || bytes.length > 8 * 1024 * 1024 || bytes.subarray(0, 8).toString("hex") !== "89504e470d0a1a0a") {
      throw Error("Invalid approved analysis image.");
    }
    return { bytes, filename: `${symbol}-analysis-${index + 1}.png`, description: `${symbol} approved analysis, part ${index + 1}` };
  });
  const content = `Free $${symbol} TradersLink Analysis${publication.updated ? " — Updated" : ""}\n\nImages show part of the analysis. View full analysis in the app 👇\n\nhttps://app.traderslink.pro/watchlist/${encodeURIComponent(symbol)}\nhttps://app.traderslink.pro/watchlist\n\n@everyone`;
  return { content, images };
}

/** Caller claims a durable receipt BEFORE invoking this function. Never auto-retry uncertain delivery. */
export async function deliverFreeChatPublication(publication: FreeChatPublication, transport: typeof fetch = fetch, environment = process.env): Promise<FreeChatDeliveryResult> {
  if(isPrivateWatchlistTicker(publication.symbol)) throw new Error("Move this ticker out of Private before publishing.");
  const payload = freeChatPayload(publication);
  const webhook = freeChatWebhook(environment);
  if (!webhook) return { state: "failed", message: "Free Chat webhook is not configured." };
  try {
    const response = await transport(webhook, { signal: AbortSignal.timeout(8000), redirect: "error" });
    const metadata = response.ok ? await response.json() : null;
    if (metadata?.channel_id !== "1433570741068234795") return { state: "failed", message: "Free Chat channel could not be verified." };
  } catch { return { state: "failed", message: "Free Chat connection could not be verified. Try again." }; }
  const form = new FormData();
  form.set("payload_json", JSON.stringify({ content: payload.content, allowed_mentions: { parse: ["everyone"] },
    attachments: payload.images.map((image, id) => ({ id, filename: image.filename, description: image.description })) }));
  payload.images.forEach((image, index) => form.set(`files[${index}]`, new Blob([new Uint8Array(image.bytes)], { type: "image/png" }), image.filename));
  webhook.searchParams.set("wait", "true");
  try {
    const response = await transport(webhook, { method: "POST", body: form, signal: AbortSignal.timeout(20000), redirect: "error" });
    if (response.ok) {
      const receipt = await response.json();
      if (typeof receipt.id === "string" && /^\d+$/.test(receipt.id)) return { state: "sent", message: "Posted to Free Chat.", messageId: receipt.id };
    } else if (response.status === 429) {
      const body = await response.json().catch(() => ({}));
      const seconds = Number(body.retry_after ?? response.headers.get("retry-after") ?? 60);
      return { state: "retry", message: "Discord requested a wait. Free Chat delivery will retry after that wait.", retryAt: Date.now() + Math.max(1000, (Number.isFinite(seconds) ? seconds : 60) * 1000) };
    } else if (response.status >= 400 && response.status < 500 && response.status !== 408) {
      return { state: "failed", message: "Discord did not accept the Free Chat post. You can retry it." };
    }
  } catch { /* Do not leak webhook credentials through transport errors. */ }
  return { state: "uncertain", message: "Free Chat delivery could not be confirmed. Check the channel before sending again." };
}
