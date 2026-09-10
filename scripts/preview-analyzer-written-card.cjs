// Small loopback-only preview; no Next build, database, provider, or writes to disk.
const esbuild = require("esbuild");
const http = require("node:http");
(async () => {
  const result = await esbuild.build({ entryPoints: ["scripts/analyzer-written-card-preview.tsx"], bundle: true, write: false, platform: "browser", format: "iife", jsx: "automatic", define: { "process.env.NODE_ENV": '"production"' }, logLevel: "error" });
  const js = result.outputFiles[0].contents;
  const server = http.createServer((req, res) => {
    res.setHeader("Cache-Control", "no-store");
    if (req.url === "/card.js") { res.setHeader("Content-Type", "text/javascript"); res.end(js); return; }
    res.setHeader("Content-Type", "text/html; charset=utf-8");
    res.end('<!doctype html><html><head><meta name="viewport" content="width=device-width,initial-scale=1"><title>Analyzer card · component QA</title><style>:root{--font-geist-sans:Arial}</style></head><body><div id="root"></div><script src="/card.js"></script></body></html>');
  });
  server.listen(0, "127.0.0.1", () => console.log(`Component preview: http://127.0.0.1:${server.address().port}`));
  setTimeout(() => server.close(), 30 * 60 * 1000).unref();
})().catch(error => { console.error(error.message); process.exitCode = 1; });
