export const TRADERLINK_PLATFORM_LOCAL_DASHBOARD_HOST = "127.0.0.1" as const;
export const TRADERLINK_PLATFORM_LOCAL_DASHBOARD_ASSERTION_HEADER =
  "x-traderlink-platform-local-dashboard" as const;
export const TRADERLINK_PLATFORM_LOCAL_DASHBOARD_TOKEN_ENV =
  "TRADERLINK_PLATFORM_LOCAL_DASHBOARD_TOKEN" as const;
export const TRADERLINK_PLATFORM_LOCAL_DASHBOARD_RUNTIME_ENV =
  "TRADERLINK_PLATFORM_LOCAL_DASHBOARD_RUNTIME" as const;
export const TRADERLINK_PLATFORM_ALLOW_DEVELOPMENT_DASHBOARD_ENV =
  "TRADERLINK_PLATFORM_ALLOW_DEVELOPMENT_DASHBOARD" as const;

const FORWARDED_HEADERS = Object.freeze([
  "forwarded",
  "x-forwarded-host",
  "x-forwarded-for",
  "x-forwarded-proto",
  "x-forwarded-port",
] as const);
const PROXY_HEADERS = Object.freeze([
  "cf-connecting-ip",
  "cf-ray",
  "client-ip",
  "fly-client-ip",
  "true-client-ip",
  "via",
  "x-envoy-external-address",
  "x-ngrok-id",
  "x-original-forwarded-for",
  "x-original-host",
  "x-real-ip",
  "x-tunnel-id",
] as const);

export type DevelopmentDashboardBoundaryResult =
  | Readonly<{ ok: true; port: string | null }>
  | Readonly<{
      ok: false;
      code:
        | "platform_local_dashboard_disabled"
        | "platform_local_dashboard_assertion_missing"
        | "platform_local_dashboard_host_invalid"
        | "platform_local_dashboard_forwarding_invalid";
    }>;

function validLoopbackAuthority(value: string | null): Readonly<{
  ok: true;
  port: string | null;
}> | Readonly<{ ok: false }> {
  if (!value || value !== value.trim() || /[\s,@/\\?#\u0000-\u001f\u007f]/u.test(value)) {
    return Object.freeze({ ok: false as const });
  }
  const ipv6 = /^\[::1\](?::(\d{1,5}))?$/iu.exec(value);
  const ipv4 = /^(?:localhost|127\.0\.0\.1)(?::(\d{1,5}))?$/iu.exec(value);
  const portValue = ipv6?.[1] ?? ipv4?.[1];
  if (!ipv6 && !ipv4) return Object.freeze({ ok: false as const });
  if (portValue !== undefined) {
    const port = Number(portValue);
    if (!Number.isSafeInteger(port) || port < 1 || port > 65_535) {
      return Object.freeze({ ok: false as const });
    }
  }
  return Object.freeze({ ok: true as const, port: portValue ?? null });
}

export function isTraderLinkPlatformLoopbackPeer(
  value: string | undefined,
): boolean {
  return value === "127.0.0.1" || value === "::1" ||
    value === "::ffff:127.0.0.1";
}

export function validateDevelopmentDashboardInboundRequest(
  requestHeaders: Headers,
): DevelopmentDashboardBoundaryResult {
  if (
    requestHeaders.has(TRADERLINK_PLATFORM_LOCAL_DASHBOARD_ASSERTION_HEADER) ||
    FORWARDED_HEADERS.some((name) => requestHeaders.has(name)) ||
    PROXY_HEADERS.some((name) => requestHeaders.has(name))
  ) {
    return Object.freeze({
      ok: false as const,
      code: "platform_local_dashboard_forwarding_invalid" as const,
    });
  }
  const authority = validLoopbackAuthority(requestHeaders.get("host"));
  return authority.ok
    ? authority
    : Object.freeze({
        ok: false as const,
        code: "platform_local_dashboard_host_invalid" as const,
      });
}

export function validateDevelopmentDashboardRequest(
  requestHeaders: Headers,
  environment: NodeJS.ProcessEnv = process.env,
): DevelopmentDashboardBoundaryResult {
  if (
    environment.NODE_ENV !== "development" ||
    environment.VERCEL_ENV !== undefined ||
    environment[TRADERLINK_PLATFORM_ALLOW_DEVELOPMENT_DASHBOARD_ENV] !== "true" ||
    environment[TRADERLINK_PLATFORM_LOCAL_DASHBOARD_RUNTIME_ENV] !== "1"
  ) {
    return Object.freeze({
      ok: false as const,
      code: "platform_local_dashboard_disabled" as const,
    });
  }
  const configuredToken = environment[
    TRADERLINK_PLATFORM_LOCAL_DASHBOARD_TOKEN_ENV
  ];
  const suppliedToken = requestHeaders.get(
    TRADERLINK_PLATFORM_LOCAL_DASHBOARD_ASSERTION_HEADER,
  );
  if (
    !configuredToken ||
    !/^[A-Za-z0-9_-]{43}$/u.test(configuredToken) ||
    suppliedToken !== configuredToken
  ) {
    return Object.freeze({
      ok: false as const,
      code: "platform_local_dashboard_assertion_missing" as const,
    });
  }
  const authority = validLoopbackAuthority(requestHeaders.get("host"));
  if (!authority.ok) {
    return Object.freeze({
      ok: false as const,
      code: "platform_local_dashboard_host_invalid" as const,
    });
  }
  if (requestHeaders.has("forwarded") ||
      PROXY_HEADERS.some((name) => requestHeaders.has(name))) {
    return Object.freeze({
      ok: false as const,
      code: "platform_local_dashboard_forwarding_invalid" as const,
    });
  }
  const expectedPort = authority.port ?? "80";
  if (
    requestHeaders.get("x-forwarded-host") !== requestHeaders.get("host") ||
    !isTraderLinkPlatformLoopbackPeer(
      requestHeaders.get("x-forwarded-for") ?? undefined,
    ) ||
    requestHeaders.get("x-forwarded-proto") !== "http" ||
    requestHeaders.get("x-forwarded-port") !== expectedPort
  ) {
    return Object.freeze({
      ok: false as const,
      code: "platform_local_dashboard_forwarding_invalid" as const,
    });
  }
  return authority;
}
