// @vitest-environment node
import { NextRequest } from "next/server";
import { afterEach, describe, expect, it, vi } from "vitest";

import { withPartnerAlertRequestRuntime } from "./partner-alert-request-runtime";

const originalEnabled = process.env.PARTNER_ALERT_REQUEST_RUNTIME_ENABLED;
const originalCatalog = process.env.PARTNER_ALERT_ERASURE_PROFILE_CATALOG_SHA256;
const originalBot = process.env.PARTNER_ALERT_OUTPUT_BOT_USER_ID;
const originalConfigurationRef = process.env.PARTNER_ALERT_OUTPUT_CONFIGURATION_REF;

afterEach(() => {
  if (originalEnabled === undefined) delete process.env.PARTNER_ALERT_REQUEST_RUNTIME_ENABLED;
  else process.env.PARTNER_ALERT_REQUEST_RUNTIME_ENABLED = originalEnabled;
  if (originalCatalog === undefined) delete process.env.PARTNER_ALERT_ERASURE_PROFILE_CATALOG_SHA256;
  else process.env.PARTNER_ALERT_ERASURE_PROFILE_CATALOG_SHA256 = originalCatalog;
  if (originalBot === undefined) delete process.env.PARTNER_ALERT_OUTPUT_BOT_USER_ID;
  else process.env.PARTNER_ALERT_OUTPUT_BOT_USER_ID = originalBot;
  if (originalConfigurationRef === undefined) delete process.env.PARTNER_ALERT_OUTPUT_CONFIGURATION_REF;
  else process.env.PARTNER_ALERT_OUTPUT_CONFIGURATION_REF = originalConfigurationRef;
});

describe("Partner Channel admitted request runtime configuration", () => {
  it("returns a private unavailable response without invoking runtime work when disabled", async () => {
    delete process.env.PARTNER_ALERT_REQUEST_RUNTIME_ENABLED;
    delete process.env.PARTNER_ALERT_ERASURE_PROFILE_CATALOG_SHA256;
    const operation = vi.fn();
    const response = await withPartnerAlertRequestRuntime(new NextRequest("https://app.example.test/private"), operation);
    expect(response.status).toBe(503);
    expect(response.headers.get("cache-control")).toContain("no-store");
    expect(operation).not.toHaveBeenCalled();
  });

  it.each([undefined, "", "not-a-digest", "A".repeat(64)])(
    "rejects a missing or malformed reviewed catalog digest %# before invoking runtime work",
    async catalog => {
      process.env.PARTNER_ALERT_REQUEST_RUNTIME_ENABLED = "true";
      if (catalog === undefined) delete process.env.PARTNER_ALERT_ERASURE_PROFILE_CATALOG_SHA256;
      else process.env.PARTNER_ALERT_ERASURE_PROFILE_CATALOG_SHA256 = catalog;
      const operation = vi.fn();
      const response = await withPartnerAlertRequestRuntime(new NextRequest("https://app.example.test/private"), operation);
      expect(response.status).toBe(503);
      expect(operation).not.toHaveBeenCalled();
    },
  );

  it.each([
    [undefined, "output_v1"], ["not-a-snowflake", "output_v1"], ["100000000000000001", undefined],
    ["100000000000000001", "contains spaces"],
  ])("rejects missing or malformed server output identity %# / %# before runtime work", async (bot, reference) => {
    process.env.PARTNER_ALERT_REQUEST_RUNTIME_ENABLED = "true";
    process.env.PARTNER_ALERT_ERASURE_PROFILE_CATALOG_SHA256 = "a".repeat(64);
    if (bot === undefined) delete process.env.PARTNER_ALERT_OUTPUT_BOT_USER_ID;
    else process.env.PARTNER_ALERT_OUTPUT_BOT_USER_ID = bot;
    if (reference === undefined) delete process.env.PARTNER_ALERT_OUTPUT_CONFIGURATION_REF;
    else process.env.PARTNER_ALERT_OUTPUT_CONFIGURATION_REF = reference;
    const operation = vi.fn();
    const response = await withPartnerAlertRequestRuntime(new NextRequest("https://app.example.test/private"), operation);
    expect(response.status).toBe(503);
    expect(operation).not.toHaveBeenCalled();
  });
});
