import "server-only";

/** Only server-exported, published approvals may be passed to this transport. */
export type FreeChatPublication = {
  symbol: string;
  cycleId: string;
  approvalRevision: number;
  updated: boolean;
  listingOnly?: boolean;
  moveTo?: string;
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

export type FreeChatVisibility = { ticker: boolean; analysis: boolean; levels: boolean };

export type FreeChatOwnerCopy = { message: string; visibilityKey: string };

export function freeChatVisibilityKey(visibility: FreeChatVisibility): string {
  return [visibility.ticker, visibility.analysis, visibility.levels].map(Number).join("");
}

export class FreeChatInputError extends Error {}

export function validateFreeChatOwnerCopy(symbol: string, value: unknown, visibility: FreeChatVisibility): string {
  if (typeof value !== "string" || value.length > 1200) throw new FreeChatInputError("Enter a message of up to 1,200 characters.");
  const message = value.trim();
  const normalized = message.normalize("NFKC").replace(/[\u200B-\u200F\uFEFF]/g, "");
  if (/@(everyone|here)\b|<@|<#/i.test(normalized)) throw new FreeChatInputError("Use the existing Discord notification tag.");
  if (visibility.ticker) {
    const escaped = symbol.replaceAll(".", "\\.");
    const ticker = new RegExp(`(?:^|[^\\p{L}\\p{N}])${escaped}(?=$|[^\\p{L}\\p{N}])`, symbol.length === 1 ? "u" : "iu");
    if (ticker.test(normalized) || normalized.toUpperCase().includes("$" + symbol) || /https?:|www\.|\b[\w-]+\.[a-z]{2,}\b/i.test(normalized)) {
      throw new FreeChatInputError("Remove the ticker and links from the message while the ticker is Premium-only.");
    }
  }
  return message;
}

export function freeChatPreview(symbol: string, updated: boolean, visibility: FreeChatVisibility, message?: string, listingOnly = false, moveTo?: string) {
  const includeImages = !listingOnly && !visibility.ticker && !visibility.analysis && !visibility.levels;
  const tickerUrl = `https://app.traderslink.pro/watchlist/${encodeURIComponent(symbol)}`;
  const labels: Record<string, string> = { main: "Main Session", top_regular: "Top Regular Hour Watches", postmarket: "Post-Market", general: "General Watchlist", swings: "Swings" };
  const destination = moveTo === undefined ? undefined : /^top_watches:\d{4}-\d{2}-\d{2}$/.test(moveTo) ? "Overnight" : labels[moveTo];
  if (moveTo !== undefined && !destination) throw new FreeChatInputError("Invalid category move.");
  const heading = destination ? `**${visibility.ticker ? "$•••• — Premium ticker" : "$" + symbol} moved to ${destination}**` : visibility.ticker ? "**$•••• — Premium ticker**" :
    listingOnly ? `**$${symbol} on the TradersLink Watchlist**` :
    includeImages ? `Free $${symbol} TradersLink Analysis${updated ? " — Updated" : ""}` : `**$${symbol} added to the Watchlist**`;
  const defaultMessage = visibility.ticker ? "On the TradersLink Watchlist." :
    listingOnly ? "See the ticker page for available details." :
    includeImages ? "Images show part of the analysis. View full analysis in the app 👇" : "";
  const footer = visibility.ticker ? "View Watchlist ↓\nhttps://app.traderslink.pro/watchlist\n\n@everyone" :
    includeImages ? `${tickerUrl}\nhttps://app.traderslink.pro/watchlist\n\n@everyone` : `View $${symbol} ↓\n${tickerUrl}\n\n@everyone`;
  return { content: [heading, message === undefined ? defaultMessage : message.trim(), footer].filter(Boolean).join("\n\n"), heading, defaultMessage, footer, includeImages,
    visibilityKey: freeChatVisibilityKey(visibility) };
}

export function freeChatPayload(publication: FreeChatPublication, visibility: FreeChatVisibility, ownerCopy?: FreeChatOwnerCopy) {
  if (!/^[A-Z][A-Z0-9]{0,9}(?:[.-][A-Z0-9]{1,2})?$/.test(publication.symbol)
    || !publication.cycleId || !Number.isSafeInteger(publication.approvalRevision)
    || publication.approvalRevision < 1 || publication.images.length > 4) throw Error("Invalid approved analysis.");
  const symbol = publication.symbol;
  if (ownerCopy && ownerCopy.visibilityKey !== freeChatVisibilityKey(visibility)) {
    throw new FreeChatInputError("Premium settings changed. Open the Free Chat preview and try again.");
  }
  const preview = freeChatPreview(symbol, publication.updated, visibility,
    ownerCopy && validateFreeChatOwnerCopy(symbol, ownerCopy.message, visibility), publication.listingOnly, publication.moveTo);
  const images = (preview.includeImages ? publication.images : []).map((image, index) => {
    const bytes = Buffer.from(image.base64, "base64");
    if (bytes.length < 33 || bytes.length > 8 * 1024 * 1024 || bytes.subarray(0, 8).toString("hex") !== "89504e470d0a1a0a") {
      throw Error("Invalid approved analysis image.");
    }
    return { bytes, filename: `${symbol}-analysis-${index + 1}.png`, description: `${symbol} approved analysis, part ${index + 1}` };
  });
  return { content: preview.content, images, suppressEmbeds: !preview.includeImages };
}

/** Caller claims a durable receipt BEFORE invoking this function. Never auto-retry uncertain delivery. */
export async function deliverFreeChatPublication(publication: FreeChatPublication, readVisibility: () => FreeChatVisibility, transport: typeof fetch = fetch, environment = process.env, ownerCopy?: FreeChatOwnerCopy): Promise<FreeChatDeliveryResult> {
  const webhook = freeChatWebhook(environment);
  if (!webhook) return { state: "failed", message: "Free Chat webhook is not configured." };
  try {
    const response = await transport(webhook, { signal: AbortSignal.timeout(8000), redirect: "error" });
    const metadata = response.ok ? await response.json() : null;
    if (metadata?.channel_id !== "1433570741068234795") return { state: "failed", message: "Free Chat channel could not be verified." };
  } catch { return { state: "failed", message: "Free Chat connection could not be verified. Try again." }; }
  let payload: ReturnType<typeof freeChatPayload>;
  try {
    payload = freeChatPayload(publication, readVisibility(), ownerCopy);
  } catch (error) {
    return { state: "failed", message: error instanceof FreeChatInputError ? error.message :
      "Free Chat post could not be prepared. Check its Premium settings and try again." };
  }
  const form = new FormData();
  form.set("payload_json", JSON.stringify({ content: payload.content, ...(payload.suppressEmbeds ? { flags: 4 } : {}), allowed_mentions: { parse: ["everyone"] },
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
