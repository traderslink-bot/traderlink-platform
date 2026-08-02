import {
  createDevelopmentOwnerSeedConfirmationAuthority,
  loadDevelopmentOwnerSeedConfirmationKey,
} from "./development-owner-seed-confirmation";

describe("development owner seed confirmation", () => {
  it("binds a short-lived token to the exact payload", () => {
    let nowMs = Date.parse("2026-08-01T14:00:00.000Z");
    const authority = createDevelopmentOwnerSeedConfirmationAuthority({
      key: Buffer.alloc(32, 7),
      now: () => new Date(nowMs),
      tokenTtlMs: 60_000,
      nonce: () => Buffer.alloc(24, 9),
    });
    const issued = authority.issue("exact-payload\n");
    expect(authority.verify(issued.token, "exact-payload\n")).toBe(true);
    expect(authority.verify(issued.token, "changed-payload\n")).toBe(false);
    nowMs += 60_001;
    expect(authority.verify(issued.token, "exact-payload\n")).toBe(false);
  });

  it("rejects malformed tokens and weak or absent configuration", () => {
    const authority = createDevelopmentOwnerSeedConfirmationAuthority({
      key: Buffer.alloc(32, 5),
    });
    expect(authority.verify("not-a-ticket", "payload")).toBe(false);
    expect(() =>
      createDevelopmentOwnerSeedConfirmationAuthority({ key: Buffer.alloc(31) }),
    ).toThrowError("TRADERLINK_DEVELOPMENT_OWNER_SEED_CONFIGURATION_INVALID");
    expect(() => loadDevelopmentOwnerSeedConfirmationKey({ NODE_ENV: "test" })).toThrowError(
      "TRADERLINK_DEVELOPMENT_OWNER_SEED_CONFIGURATION_INVALID",
    );
    expect(
      loadDevelopmentOwnerSeedConfirmationKey({
        NODE_ENV: "test",
        TRADERLINK_PLATFORM_DEVELOPMENT_OWNER_SEED_CONFIRMATION_KEY_BASE64:
          Buffer.alloc(32, 4).toString("base64"),
      }),
    ).toEqual(Buffer.alloc(32, 4));
  });
});
