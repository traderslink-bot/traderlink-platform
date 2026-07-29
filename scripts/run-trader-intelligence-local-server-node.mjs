import { createServer } from "node:http";
import { randomBytes } from "node:crypto";
import next from "next";

const PORT = Number(process.argv.includes("--port") ? process.argv[process.argv.indexOf("--port") + 1] : process.env.PORT) || 3000;
const HOSTNAME = process.argv.includes("--hostname")
  ? process.argv[process.argv.indexOf("--hostname") + 1]
  : "127.0.0.1";

const LISTENER_TOKEN_ENV = "TRADER_INTELLIGENCE_LOCAL_LISTENER_TOKEN";
const LISTENER_ASSERTION_HEADER = "x-trader-intelligence-local-listener";
const FORWARDED_HEADERS = [
  "forwarded",
  "x-forwarded-host",
  "x-forwarded-for",
  "x-forwarded-proto",
];
const PROXY_OR_TUNNEL_HEADERS = [
  "cf-connecting-ip",
  "cf-ray",
  "cf-visitor",
  "client-ip",
  "fly-client-ip",
  "x-forwarded-port",
  "x-forwarded-server",
  "x-ngrok-id",
  "x-original-forwarded-for",
  "x-original-host",
  "x-real-ip",
  "x-tunnel-id",
  "via",
  "x-envoy-external-address",
];
const NEXT_SYNTHESIZED_FORWARDED_HEADERS = [
  "x-forwarded-host",
  "x-forwarded-for",
  "x-forwarded-proto",
  "x-forwarded-port",
];
const FORBIDDEN_RAW_HEADERS = new Set([...FORWARDED_HEADERS, ...PROXY_OR_TUNNEL_HEADERS]);
const LOOPBACK_ADDRESSES = new Set(["127.0.0.1", "::1", "::ffff:127.0.0.1"]);

function isLoopbackAddress(value) {
  return LOOPBACK_ADDRESSES.has(value);
}

function normalizeHostAuthority(host) {
  return (host || `${HOSTNAME}:${PORT}`).toLowerCase();
}

function parsePortFromHost(host) {
  const lastColon = host.lastIndexOf(":");
  if (lastColon === -1) {
    return "80";
  }
  return host.slice(lastColon + 1) || "80";
}

function parseRawHeaders(rawHeaders) {
  const headers = [];
  for (let index = 0; index < rawHeaders.length; index += 2) {
    const name = String(rawHeaders[index] || "").toLowerCase();
    const value = String(rawHeaders[index + 1] ?? "");
    headers.push([name, value]);
  }
  return headers;
}

function replaceRawHeader(rawHeaders, name, value) {
  const lowered = name.toLowerCase();
  const nextRaw = rawHeaders.filter(([key]) => key.toLowerCase() !== lowered);
  nextRaw.push([name, value]);
  return nextRaw;
}

function applyTrustedRequestHeaderBridge(req, token, hostname, port) {
  const host = req.headers.host || normalizeHostAuthority(`${hostname}:${port}`);
  const forwardedPort = parsePortFromHost(host);
  const remoteAddress = req.socket.remoteAddress || "127.0.0.1";
  req.headers[LISTENER_ASSERTION_HEADER] = token;
  req.headers["x-forwarded-for"] = remoteAddress;
  req.headers["x-forwarded-host"] = host;
  req.headers["x-forwarded-proto"] = "http";
  req.headers["x-forwarded-port"] = forwardedPort;

  const headerMap = parseRawHeaders(req.rawHeaders || []);
  const sanitized = [];
  for (const [name, value] of headerMap) {
    if (!FORBIDDEN_RAW_HEADERS.has(name)) {
      sanitized.push([name, value]);
    }
  }
  const withSynthetic = [
    ...replaceRawHeader(
      replaceRawHeader(sanitized, LISTENER_ASSERTION_HEADER, token),
      "x-forwarded-for",
      remoteAddress,
    ),
    ...replaceRawHeader(
      replaceRawHeader(sanitized, "x-forwarded-host", host),
      "x-forwarded-proto",
      "http",
    ),
    ...replaceRawHeader(
      sanitized,
      "x-forwarded-port",
      forwardedPort,
    ),
  ];

  req.rawHeaders = [];
  for (const [name, value] of withSynthetic) {
    req.rawHeaders.push(name, value);
  }
}

function isTrustedRequest(req, token) {
  const host = req.headers.host || normalizeHostAuthority(`${HOSTNAME}:${PORT}`);
  const headers = req.headers;
  const hasToken = headers[LISTENER_ASSERTION_HEADER] === token;
  const hostMatches = isTrustedLoopbackHost(host);
  return hasToken && hostMatches;
}

function isTrustedLoopbackHost(value) {
  if (!value || value !== String(value).trim()) {
    return false;
  }
  return /^127\.0\.0\.1(?::\d{1,5})?$/i.test(value) || /^\[::1\](?::\d{1,5})?$/.test(value);
}

function withListenerHeaders(req, token) {
  const host = req.headers.host || normalizeHostAuthority(`${HOSTNAME}:${PORT}`);
  req.headers = { ...req.headers };
  req.headers[LISTENER_ASSERTION_HEADER] = token;
  req.headers["x-forwarded-for"] = req.socket.remoteAddress || "127.0.0.1";
  req.headers["x-forwarded-host"] = host;
  req.headers["x-forwarded-proto"] = "http";
  req.headers["x-forwarded-port"] = parsePortFromHost(host);

  const rawHeaders = [];
  if (Array.isArray(req.rawHeaders)) {
    for (let index = 0; index < req.rawHeaders.length; index += 2) {
      const name = String(req.rawHeaders[index] || "").toLowerCase();
      const value = String(req.rawHeaders[index + 1] ?? "");
      if (!FORBIDDEN_RAW_HEADERS.has(name) && name !== LISTENER_ASSERTION_HEADER) {
        rawHeaders.push([name, value]);
      }
    }
  }
  rawHeaders.push(
    [LISTENER_ASSERTION_HEADER, token],
    ["x-forwarded-for", req.headers["x-forwarded-for"]],
    ["x-forwarded-host", req.headers["x-forwarded-host"]],
    ["x-forwarded-proto", req.headers["x-forwarded-proto"]],
    ["x-forwarded-port", req.headers["x-forwarded-port"]],
  );
  req.rawHeaders = [];
  for (const [name, value] of rawHeaders) {
    req.rawHeaders.push(name, value);
  }
}

async function main() {
  const token = randomBytes(32).toString("base64url");
  process.env[LISTENER_TOKEN_ENV] = token;

  const app = next({ dev: true, hostname: HOSTNAME, port: PORT });
  const handler = app.getRequestHandler();
  await app.prepare();

  const server = createServer((request, response) => {
    if (!isLoopbackAddress(request.socket.remoteAddress || "")) {
      response.writeHead(403, {
        "cache-control": "private, no-store, max-age=0",
        "content-type": "application/json; charset=utf-8",
        expires: "0",
        pragma: "no-cache",
        vary: "Cookie",
      });
      response.end(
        JSON.stringify({
          ok: false,
          code: "ti_v3_local_request_remote_address_not_loopback",
        }),
      );
      return;
    }

    withListenerHeaders(request, token);
    applyTrustedRequestHeaderBridge(request, token, HOSTNAME, PORT);

    request.headers[LISTENER_ASSERTION_HEADER] = token;
    if (
      !isTrustedRequest(request, token) ||
      !NEXT_SYNTHESIZED_FORWARDED_HEADERS.every((name) => request.headers[name] || request.headers[name.toLowerCase()])
    ) {
      response.writeHead(400, {
        "cache-control": "private, no-store, max-age=0",
        "content-type": "application/json; charset=utf-8",
        expires: "0",
        pragma: "no-cache",
        vary: "Cookie",
      });
      response.end(
        JSON.stringify({
          ok: false,
          code: "ti_v3_local_request_forwarded_header_forbidden",
        }),
      );
      return;
    }

    handler(request, response).catch((error) => {
      console.error("Trader Intelligence local listener request failure.", {
        errorName: error instanceof Error ? error.name : "UnknownError",
      });
      if (!response.headersSent) {
        response.writeHead(500, {
          "cache-control": "private, no-store, max-age=0",
          "content-type": "application/json; charset=utf-8",
          expires: "0",
          pragma: "no-cache",
          vary: "Cookie",
        });
        response.end(
          JSON.stringify({
            ok: false,
            code: "ti_v3_local_listener_request_failure",
          }),
        );
      } else {
        response.end();
      }
    });
  });

  server.listen(PORT, HOSTNAME, () => {
    console.info("Trader Intelligence local listener ready.", {
      mode: "development",
      hostname: HOSTNAME,
      port: PORT,
    });
  });
}

main().catch((error) => {
  console.error("Trader Intelligence local listener startup failed.", {
    errorName: error instanceof Error ? error.name : "UnknownError",
    code: "ti_v3_local_listener_failure",
  });
  process.exitCode = 1;
});
