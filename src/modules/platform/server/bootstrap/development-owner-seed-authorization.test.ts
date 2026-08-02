import {
  authorizeDevelopmentOwnerSeed,
  DEVELOPMENT_OWNER_SEED_AUTH_PROVIDER,
} from "./development-owner-seed-authorization";

describe("development owner seed authorization", () => {
  it("accepts only an explicitly enabled non-production local operation", () => {
    expect(
      authorizeDevelopmentOwnerSeed({
        TRADERLINK_PLATFORM_ALLOW_DEVELOPMENT_OWNER_SEED: "1",
        NODE_ENV: "development",
      }),
    ).toEqual({
      mode: DEVELOPMENT_OWNER_SEED_AUTH_PROVIDER,
      authorized: true,
    });
  });

  it("fails closed when the enable flag is absent or malformed", () => {
    expect(() => authorizeDevelopmentOwnerSeed({ NODE_ENV: "development" })).toThrowError(
      "TRADERLINK_DEVELOPMENT_OWNER_SEED_AUTHORIZATION_REQUIRED",
    );
    expect(() =>
      authorizeDevelopmentOwnerSeed({
        NODE_ENV: "development",
        TRADERLINK_PLATFORM_ALLOW_DEVELOPMENT_OWNER_SEED: "true",
      }),
    ).toThrowError("TRADERLINK_DEVELOPMENT_OWNER_SEED_AUTHORIZATION_REQUIRED");
  });

  it("cannot be enabled in a production Node or Vercel environment", () => {
    expect(() =>
      authorizeDevelopmentOwnerSeed({
        TRADERLINK_PLATFORM_ALLOW_DEVELOPMENT_OWNER_SEED: "1",
        NODE_ENV: "production",
      }),
    ).toThrowError("TRADERLINK_DEVELOPMENT_OWNER_SEED_AUTHORIZATION_REQUIRED");
    expect(() =>
      authorizeDevelopmentOwnerSeed({
        TRADERLINK_PLATFORM_ALLOW_DEVELOPMENT_OWNER_SEED: "1",
        NODE_ENV: "development",
        VERCEL_ENV: "production",
      }),
    ).toThrowError("TRADERLINK_DEVELOPMENT_OWNER_SEED_AUTHORIZATION_REQUIRED");
  });
});
