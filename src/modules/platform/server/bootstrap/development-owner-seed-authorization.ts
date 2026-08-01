import { platformFailure } from "../database/platform-migration-contract";

export const DEVELOPMENT_OWNER_SEED_AUTH_PROVIDER =
  "development_local" as const;
export const DEVELOPMENT_OWNER_SEED_AUTH_SUBJECT = "initial_owner" as const;
export const DEVELOPMENT_OWNER_SEED_ENABLE_ENV =
  "TRADERLINK_PLATFORM_ALLOW_DEVELOPMENT_OWNER_SEED" as const;

export type DevelopmentOwnerSeedAuthorization = Readonly<{
  mode: typeof DEVELOPMENT_OWNER_SEED_AUTH_PROVIDER;
  authorized: true;
}>;

export function authorizeDevelopmentOwnerSeed(
  environment: NodeJS.ProcessEnv = process.env,
): DevelopmentOwnerSeedAuthorization {
  if (
    environment[DEVELOPMENT_OWNER_SEED_ENABLE_ENV] !== "1" ||
    environment.NODE_ENV === "production" ||
    environment.VERCEL_ENV === "production"
  ) {
    platformFailure("TRADERLINK_DEVELOPMENT_OWNER_SEED_AUTHORIZATION_REQUIRED");
  }
  return Object.freeze({
    mode: DEVELOPMENT_OWNER_SEED_AUTH_PROVIDER,
    authorized: true,
  });
}

export function requireDevelopmentOwnerSeedAuthorization(
  authorization: DevelopmentOwnerSeedAuthorization,
): void {
  if (
    authorization.mode !== DEVELOPMENT_OWNER_SEED_AUTH_PROVIDER ||
    authorization.authorized !== true
  ) {
    platformFailure("TRADERLINK_DEVELOPMENT_OWNER_SEED_AUTHORIZATION_REQUIRED");
  }
}
