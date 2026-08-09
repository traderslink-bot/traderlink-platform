import { randomBytes } from "node:crypto";
import { createServer, type IncomingMessage, type ServerResponse } from "node:http";

import next from "next";


import {
  isTraderLinkPlatformLoopbackPeer,
  TRADERLINK_PLATFORM_ALLOW_DEVELOPMENT_DASHBOARD_ENV,
  TRADERLINK_PLATFORM_LOCAL_DASHBOARD_ASSERTION_HEADER,
  TRADERLINK_PLATFORM_LOCAL_DASHBOARD_HOST,
  TRADERLINK_PLATFORM_LOCAL_DASHBOARD_RUNTIME_ENV,
  TRADERLINK_PLATFORM_LOCAL_DASHBOARD_TOKEN_ENV,
  validateDevelopmentDashboardInboundRequest,
} from "../modules/platform/server/authentication/development-dashboard-network-boundary";
import { loadTraderLinkPlatformLocalDevelopmentConfiguration } from "../modules/platform/server/authentication/local-development-configuration";
import { TRADERLINK_LEVEL_ANALYSIS_ALLOWED_PROVIDERS_ENV } from "../modules/level-analysis/server/level-analysis-delivery-request";

function argument(name: string): string | undefined {
  const index = process.argv.indexOf(name);
  return index >= 0 ? process.argv[index + 1] : undefined;
}

function port(): number {
  const value = argument("--port") ?? argument("-p") ?? process.env.PORT ?? "3010";
  if (!/^\d{1,5}$/u.test(value)) throw new Error("platform_local_port_invalid");
  const parsed = Number(value);
  if (parsed < 1 || parsed > 65_535) throw new Error("platform_local_port_invalid");
  return parsed;
}

function hostname(): typeof TRADERLINK_PLATFORM_LOCAL_DASHBOARD_HOST {
  const value = argument("--hostname") ?? argument("-H") ??
    TRADERLINK_PLATFORM_LOCAL_DASHBOARD_HOST;
  if (value !== TRADERLINK_PLATFORM_LOCAL_DASHBOARD_HOST) {
    throw new Error("platform_local_host_not_loopback");
  }
  return TRADERLINK_PLATFORM_LOCAL_DASHBOARD_HOST;
}

function headersFrom(request: IncomingMessage): Headers {
  const result = new Headers();
  for (let index = 0; index < request.rawHeaders.length; index += 2) {
    result.append(request.rawHeaders[index], request.rawHeaders[index + 1]);
  }
  return result;
}

function reject(response: ServerResponse, status: number, code: string): void {
  response.writeHead(status, {
    "cache-control": "private, no-store, max-age=0",
    "content-type": "application/json; charset=utf-8",
    expires: "0",
    pragma: "no-cache",
  });
  response.end(JSON.stringify({ ok: false, code }));
}

function startDailyTradeAnalyzerWorker(input: Readonly<{
  hostname: string;
  port: number;
}>): void {
  let processing = false;
  const processOne = async (): Promise<void> => {
    if (processing) return;
    processing = true;
    try {
      const response = await fetch(`http://${input.hostname}:${input.port}/api/platform/daily-trade-analyzer/run`, {
        method: "POST",
      });
      if (!response.ok) console.error("TraderLink daily trade analyzer worker failed.", { status: response.status });
    } catch (error) {
      console.error("TraderLink daily trade analyzer worker failed.", {
        errorName: error instanceof Error ? error.name : "UnknownError",
      });
    } finally {
      processing = false;
    }
  };
  void processOne();
  setInterval(() => void processOne(), 60_000);
}

function startMoomooExecutionImportWorker(input: Readonly<{
  hostname: string;
  port: number;
}>): void {
  let processing = false;
  const processOne = async (): Promise<void> => {
    if (processing) return;
    processing = true;
    try {
      const response = await fetch(
        `http://${input.hostname}:${input.port}/api/platform/moomoo-execution-import/run`,
        { method: "POST" },
      );
      if (!response.ok) {
        console.error("TraderLink Moomoo execution import worker failed.", {
          status: response.status,
        });
      }
    } catch (error) {
      console.error("TraderLink Moomoo execution import worker failed.", {
        errorName: error instanceof Error ? error.name : "UnknownError",
      });
    } finally {
      processing = false;
    }
  };
  void processOne();
  setInterval(() => void processOne(), 15_000);
}

async function main(): Promise<void> {
  if (!process.argv.includes("--dev")) {
    throw new Error("platform_local_development_mode_required");
  }
  const listenerHost = hostname();
  const listenerPort = port();
  loadTraderLinkPlatformLocalDevelopmentConfiguration({
    repositoryRoot: process.cwd(),
  });
  const token = randomBytes(32).toString("base64url");
  Object.assign(process.env, { NODE_ENV: "development" });
  process.env[TRADERLINK_PLATFORM_ALLOW_DEVELOPMENT_DASHBOARD_ENV] = "true";
  process.env[TRADERLINK_PLATFORM_LOCAL_DASHBOARD_RUNTIME_ENV] = "1";
  process.env[TRADERLINK_PLATFORM_LOCAL_DASHBOARD_TOKEN_ENV] = token;
  process.env[TRADERLINK_LEVEL_ANALYSIS_ALLOWED_PROVIDERS_ENV] ??= "ibkr";
  const application = next({
    dev: true,
    hostname: listenerHost,
    port: listenerPort,
    turbopack: !process.argv.includes("--webpack"),
  });
  const handler = application.getRequestHandler();
  await application.prepare();
  const server = createServer((request, response) => {
    if (!isTraderLinkPlatformLoopbackPeer(request.socket.remoteAddress)) {
      reject(response, 403, "platform_local_peer_not_loopback");
      return;
    }
    const boundary = validateDevelopmentDashboardInboundRequest(headersFrom(request));
    if (!boundary.ok) {
      reject(response, 400, boundary.code);
      return;
    }
    request.headers[TRADERLINK_PLATFORM_LOCAL_DASHBOARD_ASSERTION_HEADER] = token;
    void handler(request, response).catch((error: unknown) => {
      console.error("TraderLink Platform local request failed.", {
        errorName: error instanceof Error ? error.name : "UnknownError",
      });
      if (!response.headersSent) reject(response, 500, "platform_local_request_failed");
      else response.end();
    });
  });
  server.listen(listenerPort, listenerHost, () => {
    console.info("TraderLink Platform local dashboard ready.", {
      hostname: listenerHost,
      port: listenerPort,
    });
    startDailyTradeAnalyzerWorker({ hostname: listenerHost, port: listenerPort });
    startMoomooExecutionImportWorker({ hostname: listenerHost, port: listenerPort });
  });
}

void main().catch((error: unknown) => {
  const known = new Set([
    "platform_local_port_invalid",
    "platform_local_host_not_loopback",
    "platform_local_development_mode_required",
  ]);
  console.error("TraderLink Platform local dashboard failed to start.", {
    code: error instanceof Error && known.has(error.message)
      ? error.message
      : "platform_local_startup_failed",
    errorName: error instanceof Error ? error.name : "UnknownError",
    errorMessage: error instanceof Error ? error.message : "Unknown startup error",
  });
  process.exitCode = 1;
});
