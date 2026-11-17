// @vitest-environment node
import { afterEach, expect, it, vi } from "vitest";

const ports = vi.hoisted(() => ({
  open: vi.fn(), bind: vi.fn(), close: vi.fn(), catalog: vi.fn(), refresh: vi.fn(),
}));
vi.mock("server-only", () => ({}));
vi.mock("../../platform/server/database/open-platform-database", () => ({ openPlatformDatabase: ports.open }));
vi.mock("../../platform/server/privacy/platform-erasure-admission", () => ({ PlatformErasureAdmission: { bind: ports.bind } }));
vi.mock("./partner-alert-review-discord", () => ({ createPartnerAlertReviewDiscordChannelCatalog: ports.catalog }));
vi.mock("./partner-alert-discord-name-refresh", () => ({ refreshPartnerAlertDiscordNamesPage: ports.refresh }));

afterEach(() => {
  vi.useRealTimers();
  vi.unstubAllEnvs();
  vi.resetModules();
  vi.resetAllMocks();
});

it("registers one timer only when enabled and advances the cursor using admitted batches", async () => {
  vi.useFakeTimers();
  vi.stubEnv("NODE_ENV", "production");
  vi.stubEnv("PARTNER_ALERT_DISCORD_NAME_REFRESH_ENABLED", "false");
  vi.stubEnv("PARTNER_ALERT_ERASURE_PROFILE_CATALOG_SHA256", "a".repeat(64));
  vi.stubEnv("PARTNER_ALERT_DISCORD_BOT_TOKEN", "synthetic-token");
  vi.stubEnv("PARTNER_ALERT_DISCORD_BOT_USER_ID", "850000000000000099");
  const database = { close: ports.close };
  const admission = {};
  const catalog = vi.fn();
  ports.open.mockReturnValue(database);
  ports.bind.mockReturnValue(admission);
  ports.catalog.mockReturnValue(catalog);
  ports.refresh.mockResolvedValueOnce("next-community").mockResolvedValueOnce(null);

  const { startPartnerAlertDiscordNameRefresh } = await import("./partner-alert-discord-name-refresh-runtime");
  startPartnerAlertDiscordNameRefresh();
  expect(vi.getTimerCount()).toBe(0);

  vi.stubEnv("PARTNER_ALERT_DISCORD_NAME_REFRESH_ENABLED", "true");
  startPartnerAlertDiscordNameRefresh();
  startPartnerAlertDiscordNameRefresh();
  expect(vi.getTimerCount()).toBe(1);
  await vi.advanceTimersByTimeAsync(120_000);
  expect(ports.refresh).toHaveBeenNthCalledWith(1, database, admission, catalog, null, expect.any(AbortSignal));
  expect(ports.refresh).toHaveBeenNthCalledWith(2, database, admission, catalog, "next-community", expect.any(AbortSignal));
  expect(ports.close).toHaveBeenCalledTimes(2);

  vi.stubEnv("PARTNER_ALERT_DISCORD_NAME_REFRESH_ENABLED", "false");
  await vi.advanceTimersByTimeAsync(60_000);
  expect(ports.open).toHaveBeenCalledTimes(2);
});
