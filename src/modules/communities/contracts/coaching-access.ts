export type CoachingAccessPauseReason =
  | "required_role_missing"
  | "discord_verification_unavailable"
  | "server_membership_inactive"
  | "community_inactive";

/** Shared wording for student banners and newly created participant notices. */
export function coachingAccessPauseMessage(reason: CoachingAccessPauseReason | null | undefined): string {
  switch (reason) {
    case "required_role_missing":
      return "The Discord role required for this coaching plan is not currently assigned to your linked account. Contact the server owner or an administrator who manages Discord roles. If you manage roles, check this account's required role in Discord, then refresh coaching access.";
    case "server_membership_inactive":
      return "Your membership in this Discord community is inactive. Contact the server owner or an administrator to check your server membership and access.";
    case "community_inactive":
      return "This community is currently paused. Contact the server owner. If you own this community, check its status in community settings.";
    default:
      return "We couldn’t refresh your Discord access. Try refreshing once. If access remains paused, contact the server owner or an administrator to check the bot’s server access. If you own the server, check the bot’s connection and permissions.";
  }
}

/** Avoid claiming a historical role removal without rewriting stored notices. */
export function coachingAccessNoticeMessage(body: string): string {
  return body === "Coaching access paused — required Discord role removed" ? "Coaching access paused" : body;
}
