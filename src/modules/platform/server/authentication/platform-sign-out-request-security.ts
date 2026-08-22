import "server-only";

export function isSameOriginPlatformSignOutRequest(request: Request): boolean {
  if (request.method !== "POST") return false;
  const origin = request.headers.get("origin") ?? request.headers.get("referer");
  if (!origin) return false;
  try {
    const originUrl = new URL(origin);
    const requestUrl = new URL(request.url);
    const forwardedHost = request.headers.get("x-forwarded-host")
      ?.split(",", 1)[0]?.trim();
    const forwardedProtocol = request.headers.get("x-forwarded-proto")
      ?.split(",", 1)[0]?.trim();
    const effectiveProtocol = forwardedProtocol === "http" || forwardedProtocol === "https"
      ? `${forwardedProtocol}:`
      : requestUrl.protocol;
    const effectiveHost = forwardedHost || request.headers.get("host") || requestUrl.host;
    return originUrl.protocol === effectiveProtocol &&
      originUrl.host.toLowerCase() === effectiveHost.toLowerCase();
  } catch {
    return false;
  }
}
