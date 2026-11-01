const prefix = process.env.NODE_ENV === "production" ? "__Host-" : "";
export const PLATFORM_DISCORD_OAUTH_STATE_COOKIE = `${prefix}tl_academy_oauth_state`;
export const PLATFORM_DISCORD_OAUTH_PROMPT_COOKIE = `${prefix}tl_academy_oauth_prompt`;
export const PLATFORM_DISCORD_OAUTH_RETURN_TO_COOKIE =
  `${prefix}tl_academy_oauth_return_to`;
export const LEGACY_ACADEMY_SESSION_COOKIE = "tl_academy_session";
