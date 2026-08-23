const MAXIMUM_USER_AGENT_LENGTH = 512;

function resolveBrowser(userAgent: string): string | null {
  if (/Edg\//u.test(userAgent)) return "Microsoft Edge";
  if (/OPR\//u.test(userAgent)) return "Opera";
  if (/SamsungBrowser\//u.test(userAgent)) return "Samsung Internet";
  if (/FxiOS\//u.test(userAgent) || /Firefox\//u.test(userAgent)) return "Firefox";
  if (/CriOS\//u.test(userAgent) || /Chrome\//u.test(userAgent)) return "Chrome";
  if (/Version\/[^ ]+.*Safari\//u.test(userAgent)) return "Safari";
  return null;
}

function resolveDevice(userAgent: string): string | null {
  if (/iPhone/u.test(userAgent)) return "iPhone";
  if (/iPad/u.test(userAgent)) return "iPad";
  if (/Android.*Mobile/u.test(userAgent)) return "Android phone";
  if (/Android/u.test(userAgent)) return "Android tablet";
  if (/Windows NT/u.test(userAgent)) return "Windows";
  if (/CrOS/u.test(userAgent)) return "Chromebook";
  if (/Macintosh/u.test(userAgent)) return "Mac";
  if (/Linux/u.test(userAgent)) return "Linux";
  return null;
}

/**
 * Returns a deliberately coarse label for the Security page. It never stores
 * the raw user agent, browser version, IP address, or a derived location.
 */
export function resolvePlatformSessionClientLabel(
  userAgent: string | null,
): string | null {
  if (!userAgent || userAgent.length > MAXIMUM_USER_AGENT_LENGTH) return null;
  if (/bot|crawler|spider|curl|wget/u.test(userAgent)) return null;

  const browser = resolveBrowser(userAgent);
  const device = resolveDevice(userAgent);
  return browser && device ? `${browser} on ${device}` : null;
}
