const { spawn } = require("node:child_process");
const http = require("node:http");

const port = Number(process.env.PORT ?? "3000");
const maximumRuntimeMs = 15 * 60 * 1000;
let cleanupStatus = "running";

const server = http.createServer((request, response) => {
  response.setHeader("content-type", "application/json; charset=utf-8");
  if (request.url === "/api/platform/health") {
    response.statusCode = 200;
    response.end(JSON.stringify({
      status: "maintenance",
      operation: "watchlist_checkpoint_cleanup",
      cleanupStatus,
      migrationCount: 137,
      storage: "sqlite_single_node",
    }));
    return;
  }
  response.statusCode = 503;
  response.end(JSON.stringify({
    status: "maintenance",
    operation: "watchlist_checkpoint_cleanup",
    cleanupStatus,
  }));
});

server.listen(port, "0.0.0.0", () => {
  process.stdout.write(`${JSON.stringify({ status: "checkpoint_cleanup_host_ready", port })}\n`);

  const child = spawn(
    process.execPath,
    ["src/scripts/cleanup-watchlist-release-checkpoints.mjs"],
    { env: process.env, stdio: ["ignore", "inherit", "inherit"] },
  );
  const timeout = setTimeout(() => {
    cleanupStatus = "failed";
    child.kill("SIGTERM");
    process.stderr.write(`${JSON.stringify({
      status: "checkpoint_cleanup_host_timeout",
      maximumRuntimeMs,
    })}\n`);
    server.close(() => process.exit(1));
  }, maximumRuntimeMs);
  timeout.unref();

  child.on("error", (error) => {
    cleanupStatus = "failed";
    clearTimeout(timeout);
    process.stderr.write(`${JSON.stringify({
      status: "checkpoint_cleanup_host_error",
      error: error.message,
    })}\n`);
    server.close(() => process.exit(1));
  });
  child.on("close", (code, signal) => {
    clearTimeout(timeout);
    cleanupStatus = code === 0 ? "complete" : "failed";
    process.stdout.write(`${JSON.stringify({
      status: "checkpoint_cleanup_host_result",
      cleanupStatus,
      code,
      signal,
    })}\n`);
    server.close(() => process.exit(code === 0 ? 0 : 1));
  });
});
