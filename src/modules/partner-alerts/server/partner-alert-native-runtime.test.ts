// @vitest-environment node
import { afterEach, expect, it, vi } from "vitest";
import { startConfiguredPartnerAlertMaintenance, startReviewedPartnerAlertNativeProvider,
  type PartnerAlertNativeProvider } from "./partner-alert-native-runtime";

const { start } = vi.hoisted(() => ({ start: vi.fn() }));
vi.mock("./partner-alert-maintenance", () => ({ startPartnerAlertMaintenance: start }));
afterEach(() => { vi.unstubAllEnvs(); start.mockReset(); });

it("does not publish a reviewed provider when its maintenance connection fails to start", () => {
  vi.stubEnv("NODE_ENV", "production");
  vi.stubEnv("PARTNER_ALERT_LIFECYCLE_ENABLED", "true");
  const provider = { maintenance: {}, bindSubscriber: vi.fn() } as unknown as PartnerAlertNativeProvider;
  start.mockImplementationOnce(() => { throw new Error("failed startup"); });
  expect(() => startReviewedPartnerAlertNativeProvider(provider)).toThrow("failed startup");
  expect(startConfiguredPartnerAlertMaintenance()).toBeNull();
});

it("publishes once after qualified startup and clears the provider on shutdown", async () => {
  vi.stubEnv("NODE_ENV", "production");
  vi.stubEnv("PARTNER_ALERT_LIFECYCLE_ENABLED", "true");
  const provider = { maintenance: {}, bindSubscriber: vi.fn() } as unknown as PartnerAlertNativeProvider;
  const drain = vi.fn(async () => {});
  start.mockReturnValue(drain);
  const stop = startReviewedPartnerAlertNativeProvider(provider);
  try {
    expect(startConfiguredPartnerAlertMaintenance()).toBe(stop);
    expect(() => startReviewedPartnerAlertNativeProvider(provider)).toThrow("already installed");
    expect(start).toHaveBeenCalledOnce();
  } finally { await stop(); }
  expect(drain).toHaveBeenCalledOnce();
  expect(startConfiguredPartnerAlertMaintenance()).toBeNull();
});
