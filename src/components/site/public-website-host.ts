function normalizeHost(host: string | null): string | null {
  return host?.split(",")[0]?.trim().split(":")[0]?.toLowerCase() ?? null;
}

export function isPublicWebsiteHost(
  host: string | null,
  forwardedHost: string | null,
): boolean {
  const directHostname = normalizeHost(host);

  if (directHostname === "app.traderslink.pro") {
    return false;
  }

  if (
    directHostname === "traderslink.pro" ||
    directHostname === "www.traderslink.pro"
  ) {
    return true;
  }

  const forwardedHostname = normalizeHost(forwardedHost);
  return (
    forwardedHostname === "traderslink.pro" ||
    forwardedHostname === "www.traderslink.pro"
  );
}
