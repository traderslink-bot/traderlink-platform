import { platformFailure } from "../database/platform-migration-contract";

export const TRADERLINK_DISCORD_GUILD_ID_ENV = "DISCORD_GUILD_ID" as const;
export const DEFAULT_TRADERLINK_DISCORD_GUILD_ID = "1433570740430573642" as const;
export const TRADERLINK_INITIAL_OWNER_DISCORD_SUBJECT_ENV =
  "TRADERLINK_PLATFORM_INITIAL_OWNER_DISCORD_SUBJECT" as const;

const DISCORD_SNOWFLAKE_PATTERN = /^[0-9]{1,32}$/u;

export function resolveTraderLinkDiscordGuildId(
  environment: NodeJS.ProcessEnv = process.env,
): string {
  const value = environment[TRADERLINK_DISCORD_GUILD_ID_ENV] ??
    DEFAULT_TRADERLINK_DISCORD_GUILD_ID;
  if (!DISCORD_SNOWFLAKE_PATTERN.test(value)) {
    platformFailure("TRADERLINK_DISCORD_MEMBERSHIP_INVALID", {
      field: "guildId",
    });
  }
  return value;
}

export function readProtectedInitialOwnerDiscordSubject(
  environment: NodeJS.ProcessEnv = process.env,
): string | undefined {
  const value = environment[TRADERLINK_INITIAL_OWNER_DISCORD_SUBJECT_ENV];
  if (value === undefined) return undefined;
  if (!DISCORD_SNOWFLAKE_PATTERN.test(value)) {
    platformFailure("TRADERLINK_INITIAL_OWNER_LINK_PRECONDITION_FAILED", {
      check: "configured_discord_subject",
    });
  }
  return value;
}
