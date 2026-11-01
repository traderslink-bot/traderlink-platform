/** Reader-facing News URLs are independent of the publisher's API origin. */
export const PUBLIC_NEWS_ORIGIN = "https://traderslink.pro";

export function publicNewsUrl(path: string): string {
  return new URL(path, PUBLIC_NEWS_ORIGIN).href;
}
