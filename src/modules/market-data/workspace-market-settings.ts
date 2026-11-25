export type WorkspaceMarketSettings = Readonly<{
  revision: number;
  currentAudience: "review" | "members";
  brokerAudience: "off" | "review" | "members";
  cardTransport: "websocket" | "rest";
  cardRefreshMs: number | null;
  restBatchSize: number;
  restSpacingMs: number;
  restPassWaitMs: number;
}>;

export const DEFAULT_WORKSPACE_MARKET_SETTINGS: WorkspaceMarketSettings = Object.freeze({
  revision: 0,
  currentAudience: "review",
  brokerAudience: "off",
  cardTransport: "websocket",
  cardRefreshMs: null,
  restBatchSize: 400,
  restSpacingMs: 1500,
  restPassWaitMs: 5000,
});

const MAX_TIMER_DELAY = 2_147_483_647;

function boundedInteger(value: unknown, min: number, max: number): value is number {
  return typeof value === "number" && Number.isSafeInteger(value) && value >= min && value <= max;
}

export function parseWorkspaceMarketSettings(input: unknown): WorkspaceMarketSettings {
  if (!input || typeof input !== "object" || Array.isArray(input)) throw Error("invalid_workspace_settings");
  const value = input as Record<string, unknown>;
  const { revision, currentAudience, brokerAudience, cardTransport, cardRefreshMs, restBatchSize, restSpacingMs, restPassWaitMs } = value;
  if (!boundedInteger(revision, 0, Number.MAX_SAFE_INTEGER - 1)
      || (currentAudience !== "review" && currentAudience !== "members")
      || (brokerAudience !== "off" && brokerAudience !== "review" && brokerAudience !== "members")
      || (cardTransport !== "websocket" && cardTransport !== "rest")
      || (cardRefreshMs !== null && !boundedInteger(cardRefreshMs, 1000, MAX_TIMER_DELAY))
      || !boundedInteger(restBatchSize, 1, DEFAULT_WORKSPACE_MARKET_SETTINGS.restBatchSize)
      || !boundedInteger(restSpacingMs, 500, MAX_TIMER_DELAY)
      || !boundedInteger(restPassWaitMs, 0, MAX_TIMER_DELAY)) {
    throw Error("invalid_workspace_settings");
  }
  return { revision, currentAudience, brokerAudience, cardTransport, cardRefreshMs, restBatchSize, restSpacingMs, restPassWaitMs };
}

export function workspaceAudienceAllows(audience: "off" | "review" | "members", reviewAccount: boolean): boolean {
  return audience === "members" || (audience === "review" && reviewAccount);
}
