export const PRESS_RELEASE_CHANNELS = Object.freeze([
  "all",
  "news_filtered",
  "market_cap_all",
  "market_cap_under_30m",
  "market_cap_30m_to_50m",
  "market_cap_50m_to_100m",
] as const);

export type PressReleaseChannel = (typeof PRESS_RELEASE_CHANNELS)[number];

export const PRESS_RELEASE_PUSH_CHANNELS = Object.freeze([
  "news_filtered",
  "market_cap_under_30m",
  "market_cap_30m_to_50m",
  "market_cap_50m_to_100m",
] as const);

export type PressReleasePushChannel =
  (typeof PRESS_RELEASE_PUSH_CHANNELS)[number];

export type PressReleaseChannelDefinition = Readonly<{
  channel: PressReleaseChannel;
  href: string;
  label: string;
  shortLabel: string;
}>;

export const PRESS_RELEASE_CHANNEL_DEFINITIONS: readonly PressReleaseChannelDefinition[] =
  Object.freeze([
    Object.freeze({ channel: "all", href: "/press-releases", label: "All Press Releases", shortLabel: "All" }),
    Object.freeze({ channel: "news_filtered", href: "/press-releases/news-filtered", label: "News Scanner", shortLabel: "Scanner" }),
    Object.freeze({ channel: "market_cap_all", href: "/press-releases/market-cap", label: "All Market Cap", shortLabel: "All Market Cap" }),
    Object.freeze({ channel: "market_cap_under_30m", href: "/press-releases/market-cap/under-30m", label: "Under $30M Market Cap", shortLabel: "Under $30M" }),
    Object.freeze({ channel: "market_cap_30m_to_50m", href: "/press-releases/market-cap/30m-50m", label: "$30M–$50M Market Cap", shortLabel: "$30M–$50M" }),
    Object.freeze({ channel: "market_cap_50m_to_100m", href: "/press-releases/market-cap/50m-100m", label: "$50M–$100M Market Cap", shortLabel: "$50M–$100M" }),
  ]);

export type PressReleaseUnreadCounts = Readonly<
  Record<PressReleaseChannel, number>
>;

export type PressReleaseArticle = Readonly<{
  articleText: string | null;
  eventType: string | null;
  headline: string;
  id: string;
  isRead: boolean;
  marketCap: string | null;
  negatives: readonly string[];
  positives: readonly string[];
  publishedAt: string;
  publicPath: string;
  riskFlags: readonly string[];
  routeTag: string | null;
  sourceUrl: string | null;
  summary: string | null;
  supportResistanceLevels: readonly string[];
  ticker: string;
}>;

export function isPressReleaseChannel(value: string): value is PressReleaseChannel {
  return PRESS_RELEASE_CHANNELS.includes(value as PressReleaseChannel);
}
export function isPressReleasePushChannel(
  value: string,
): value is PressReleasePushChannel {
  return PRESS_RELEASE_PUSH_CHANNELS.includes(value as PressReleasePushChannel);
}

export function pressReleaseChannelDefinition(
  channel: PressReleaseChannel,
): PressReleaseChannelDefinition {
  const definition = PRESS_RELEASE_CHANNEL_DEFINITIONS.find(
    (candidate) => candidate.channel === channel,
  );
  if (!definition) throw new Error("Press release channel is not configured.");
  return definition;
}
