export function isPublicWebsiteHost(host: string | null): boolean {
  const hostname = host?.split(",")[0]?.trim().split(":")[0]?.toLowerCase();
  return hostname === "traderslink.pro" || hostname === "www.traderslink.pro";
}
