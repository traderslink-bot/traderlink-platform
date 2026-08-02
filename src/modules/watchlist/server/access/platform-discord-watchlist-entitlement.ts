export function premiumRoleId(
  environment: NodeJS.ProcessEnv = process.env,
): string | null {
  return environment.TRADERSLINK_PREMIUM_DISCORD_ROLE_ID?.trim() ||
    environment.DISCORD_PREMIUM_ROLE_ID?.trim() ||
    null;
}

export function isPremiumWatchlistRoleConfigured(
  environment: NodeJS.ProcessEnv = process.env,
): boolean {
  return Boolean(premiumRoleId(environment));
}

export function hasPlatformDiscordPremiumAccess(
  input: Readonly<{
    guildOwner: boolean;
    roleIds: readonly string[];
  }>,
  environment: NodeJS.ProcessEnv = process.env,
): boolean {
  const roleId = premiumRoleId(environment);
  if (!roleId) return environment.NODE_ENV !== "production";
  return input.guildOwner || input.roleIds.includes(roleId);
}
