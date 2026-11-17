type Environment = Readonly<Record<string, string | undefined>>;

/** Explicit, temporary opt-in for the isolated synthetic owner preview only. */
function privateSyntheticPreview(environment: Environment): boolean {
  if (environment.NODE_ENV !== "development"
    || environment.TRADERLINK_SHARED_ALERTS_OWNER_PREVIEW !== "1"
    || environment.HOSTNAME !== "127.0.0.1"
    || environment.PORT !== environment.TRADERLINK_SHARED_ALERTS_OWNER_PREVIEW_PORT
    || !["3010", "3032"].includes(environment.PORT ?? "")
    || environment.TRADERLINK_DISCORD_BOT_TOKEN !== "synthetic-owner-preview-bot"
    || environment.TRADERLINK_COMMUNITY_DISCORD_DELIVERY_ENABLED !== "false"
    || environment.TRADERLINK_PLATFORM_BACKGROUND_WORKERS_MODE !== "disabled_isolated_qualification") return false;
  if (["VERCEL", "RAILWAY_PROJECT_ID", "RAILWAY_ENVIRONMENT_ID", "RAILWAY_VOLUME_MOUNT_PATH"].some(key => environment[key])) return false;
  const path = environment.TRADERLINK_PLATFORM_DB_PATH ?? "";
  return /^\/home\/traderlink\/preview-runtime\/shared-alerts-owner-(?:preview-[a-z0-9-]+|browser-[a-f0-9-]+|qa-[a-f0-9-]+)\/traderlink-platform\.sqlite$/.test(path)
    && environment.TRADERLINK_PLATFORM_LOCAL_PRIVATE_DATA_ROOT === path.slice(0, path.lastIndexOf("/"));
}

export function sharedAlertsPreviewPeerLimitLifted(environment: Environment = process.env): boolean {
  return environment.TRADERLINK_SHARED_ALERTS_PREVIEW_LIFT_PEER_LIMIT === "1" && privateSyntheticPreview(environment);
}
export function sharedAlertsPreviewHourlyLimitLifted(environment: Environment = process.env): boolean {
  return environment.TRADERLINK_SHARED_ALERTS_PREVIEW_LIFT_HOURLY_LIMIT === "1" && privateSyntheticPreview(environment);
}
export function sharedAlertsPreviewMessageLimitLifted(environment: Environment = process.env): boolean {
  return environment.TRADERLINK_SHARED_ALERTS_PREVIEW_LIFT_MESSAGE_LIMIT === "1" && privateSyntheticPreview(environment);
}
