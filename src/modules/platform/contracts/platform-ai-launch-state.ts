export const TRADERLINK_PLATFORM_AI_LAUNCH_STATE_ENV =
  "NEXT_PUBLIC_TRADERLINK_PLATFORM_AI_LAUNCH_STATE" as const;

export type TraderLinkPlatformAiLaunchState = "coming_soon" | "enabled";

type TraderLinkPlatformAiLaunchEnvironment = Readonly<Partial<Record<
  "NODE_ENV" | typeof TRADERLINK_PLATFORM_AI_LAUNCH_STATE_ENV,
  string | undefined
>>>;

const defaultAiLaunchEnvironment: TraderLinkPlatformAiLaunchEnvironment = Object.freeze({
  NEXT_PUBLIC_TRADERLINK_PLATFORM_AI_LAUNCH_STATE:
    process.env.NEXT_PUBLIC_TRADERLINK_PLATFORM_AI_LAUNCH_STATE,
  NODE_ENV: process.env.NODE_ENV,
});

export function resolveTraderLinkPlatformAiLaunchState(
  environment: TraderLinkPlatformAiLaunchEnvironment = defaultAiLaunchEnvironment,
): TraderLinkPlatformAiLaunchState {
  const configured = environment[TRADERLINK_PLATFORM_AI_LAUNCH_STATE_ENV];
  if (configured === "enabled" || configured === "coming_soon") {
    return configured;
  }

  return environment.NODE_ENV === "production" ? "coming_soon" : "enabled";
}

export function areTraderLinkPlatformAiFeaturesEnabled(
  environment?: TraderLinkPlatformAiLaunchEnvironment,
): boolean {
  return resolveTraderLinkPlatformAiLaunchState(environment) === "enabled";
}
