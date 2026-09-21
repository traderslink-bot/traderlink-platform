/** Shared wire contract for an explicitly approved, website-acknowledged post.
 * There is deliberately no analysis body, price, email address or image here.
 * Authentication and durable publication evidence are checked by the receiver.
 */
export type WatchlistPublicationNotificationEvent = Readonly<{
  version: 1 | 2;
  cycleId: string;
  ticker: string;
  approvedAtUtc: string;
  publishedAtUtc: string;
  notificationKind?: "listing" | "analysis";
  approvalRevision?: number;
  notifyUsers?: boolean;
}>;

export type WatchlistNotificationChannel = "web_push" | "email";

export type WatchlistApprovalIntent = Readonly<{
  cycleId: string; ticker: string; expectedHead: number; draftRevision: number; actor: string;
}>;

/** Trust only the authenticated runtime's persisted approval and website receipt,
 * never an HTTP success alone or the owner's submitted draft contents. */
export function publicationFromReview(intent: WatchlistApprovalIntent, value: unknown, nowMs: number) {
  if (!value || typeof value !== "object") return null;
  const review = value as Record<string, unknown>;
  if (review.cycleId !== intent.cycleId || review.symbol !== intent.ticker || review.cancelled !== false || !Array.isArray(review.events)) return null;
  type Evidence = { revision: number; actor: string; at: number; body?: {
    kind?: string; draftRevision?: number; channel?: string; status?: string; approvalRevision?: number;
    publication?: { notificationKind?: string; notifyUsers?: boolean };
  } };
  const records = review.events.filter(item => Boolean(item && typeof item === "object")) as Evidence[];
  const approval = records.find(item => item.body?.kind === "approve" && item.actor === intent.actor &&
    Number.isSafeInteger(item.revision) && item.revision > intent.expectedHead && item.body.draftRevision === intent.draftRevision);
  if (!approval || !Number.isFinite(approval.at)) return null;
  const receipt = records.find(item => item.body?.kind === "delivery" && item.body.channel === "website" &&
    item.body.status === "acknowledged" && item.body.approvalRevision === approval.revision && Number.isFinite(item.at));
  if (!receipt || receipt.at < approval.at) return null;
  try {
    const publication = approval.body?.publication;
    const action = publication?.notificationKind;
    if (action !== undefined && (action !== "listing" && action !== "analysis" || typeof publication?.notifyUsers !== "boolean")) return null;
    return parseWatchlistPublicationNotificationEvent({ version: action ? 2 : 1, cycleId: intent.cycleId, ticker: intent.ticker,
      approvedAtUtc: new Date(approval.at).toISOString(), publishedAtUtc: new Date(receipt.at).toISOString(),
      ...(action ? { notificationKind: action, approvalRevision: approval.revision, notifyUsers: publication!.notifyUsers } : {}) }, nowMs);
  } catch { return null; }
}

// Day-trading notifications must not arrive days after the original post.
export const WATCHLIST_NOTIFICATION_MAX_AGE_MS = 60 * 60 * 1_000;
export const WATCHLIST_NOTIFICATION_MAX_ATTEMPTS = 5;
const CLOCK_SKEW_MS = 60_000;
const uuid = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/u;
const tickerPattern = /^[A-Z][A-Z0-9]{0,9}(?:[.-][A-Z0-9]{1,2})?$/u;

function canonicalTime(value: unknown): value is string {
  if (typeof value !== "string" || !/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/u.test(value)) return false;
  const parsed = Date.parse(value);
  return Number.isFinite(parsed) && new Date(parsed).toISOString() === value;
}

export function parseWatchlistPublicationNotificationEvent(
  value: unknown,
  nowMs: number,
): WatchlistPublicationNotificationEvent | null {
  if (!value || typeof value !== "object" || Array.isArray(value) || !Number.isFinite(nowMs)) return null;
  const event = value as Record<string, unknown>;
  const keys = ["version", "cycleId", "ticker", "approvedAtUtc", "publishedAtUtc"];
  if (event.version === 2) keys.push("notificationKind", "approvalRevision", "notifyUsers");
  if (Object.keys(event).length !== keys.length || keys.some(key => !Object.hasOwn(event, key))) return null;
  if (![1,2].includes(event.version as number) || typeof event.cycleId !== "string" || !uuid.test(event.cycleId) ||
    typeof event.ticker !== "string" || !tickerPattern.test(event.ticker) ||
    !canonicalTime(event.approvedAtUtc) || !canonicalTime(event.publishedAtUtc)) return null;
  const approved = Date.parse(event.approvedAtUtc);
  const published = Date.parse(event.publishedAtUtc);
  if (approved > published || published > nowMs + CLOCK_SKEW_MS) return null;
  if (event.version === 2 && (!["listing","analysis"].includes(event.notificationKind as string) ||
    !Number.isSafeInteger(event.approvalRevision) || (event.approvalRevision as number) < 1 || typeof event.notifyUsers !== "boolean" ||
    (event.notificationKind === "listing" && event.notifyUsers !== true))) return null;
  return Object.freeze({ version: event.version as 1 | 2, cycleId: event.cycleId, ticker: event.ticker,
    approvedAtUtc: event.approvedAtUtc, publishedAtUtc: event.publishedAtUtc,
    ...(event.version === 2 ? { notificationKind: event.notificationKind as "listing" | "analysis",
      approvalRevision: event.approvalRevision as number, notifyUsers: event.notifyUsers as boolean } : {}) });
}

/** Old events remain identifiable for durable acknowledgement, but cannot send. */
export function watchlistNotificationExpired(
  event: WatchlistPublicationNotificationEvent,
  nowMs: number,
): boolean {
  return !Number.isFinite(nowMs) || nowMs >= Date.parse(event.publishedAtUtc) + WATCHLIST_NOTIFICATION_MAX_AGE_MS;
}

export function watchlistPublicationNotificationCopy(ticker: string, kind: "listing" | "analysis" = "listing") {
  if (!tickerPattern.test(ticker)) throw new Error("Invalid Watchlist ticker.");
  return Object.freeze({
    destinationPath: `/watchlist/${ticker}`,
    pushTitle: kind === "analysis" ? `${ticker} Analysis updated` : `${ticker} added to the Watchlist`,
    pushBody: kind === "analysis" ? `An approved TradersLink Analysis is ready for ${ticker}.` : `A new Watchlist post is ready. Open ${ticker} to view the levels and available analysis.`,
    emailTitle: kind === "analysis" ? `${ticker} Analysis updated` : `${ticker} added to the TradersLink Watchlist`,
    emailBody: kind === "analysis" ? `An approved TradersLink Analysis for ${ticker} is ready.` : `A new Watchlist post for ${ticker} is ready.`,
    emailTickerLabel: `View ${ticker}`,
    emailWatchlistLabel: "View Watchlist",
    emailWatchlistPath: "/watchlist",
  });
}
