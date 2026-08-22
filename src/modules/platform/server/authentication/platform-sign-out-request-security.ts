import "server-only";

export function isSameOriginPlatformSignOutRequest(request: Request): boolean {
  if (request.method !== "POST") return false;
  if (request.headers.get("sec-fetch-site") !== "same-origin") return false;
  const origin = request.headers.get("origin");
  if (!origin) return false;
  try {
    const requestUrl = new URL(request.url);
    const originUrl = new URL(origin);
    return originUrl.origin === requestUrl.origin;
  } catch {
    return false;
  }
}
