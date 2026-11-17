import { describe, expect, it } from "vitest";

import { readPartnerAlertCatalogRuntimeConfiguration } from "./partner-alert-catalog-runtime-configuration";

const key = Buffer.alloc(32, 4).toString("base64");
const configured = () => ({ PARTNER_ALERT_CATALOG_CHECKOUT_ENABLED: "true",
  PARTNER_ALERT_WHOP_CREDENTIAL_ACTIVE_KEY_VERSION: "current",
  PARTNER_ALERT_WHOP_CREDENTIAL_KEYS_JSON: JSON.stringify({ current: key }),
  PARTNER_ALERT_WHOP_EVIDENCE_MAX_AGE_MS: "60000" });

describe("Partner Channel catalog runtime configuration", () => {
  it("is disabled by default and rejects partial or malformed secret configuration", () => {
    expect(readPartnerAlertCatalogRuntimeConfiguration({})).toBeNull();
    expect(readPartnerAlertCatalogRuntimeConfiguration({ ...configured(),
      PARTNER_ALERT_WHOP_CREDENTIAL_KEYS_JSON: "{}" })).toBeNull();
    expect(readPartnerAlertCatalogRuntimeConfiguration({ ...configured(),
      PARTNER_ALERT_WHOP_CREDENTIAL_KEYS_JSON: JSON.stringify({ current: "not-a-key" }) })).toBeNull();
    expect(readPartnerAlertCatalogRuntimeConfiguration({ ...configured(),
      PARTNER_ALERT_WHOP_EVIDENCE_MAX_AGE_MS: "300001" })).toBeNull();
  });

  it("returns only validated server key material and the bounded evidence age", () => {
    expect(readPartnerAlertCatalogRuntimeConfiguration(configured())).toEqual({
      credentialKeys: { activeKeyVersion: "current", keysBase64: { current: key } }, maximumEvidenceAgeMs: 60_000,
    });
  });
});
