// Codespaces can rewrite browser Origin to its loopback forwarding target.
// Restore it only for a registered HTTPS preview and browser same-origin metadata.
function restorePreviewRequestOrigin(headers, origin, port) {
  const expected = new URL(origin);
  if (expected.protocol !== 'https:' || !expected.hostname.endsWith(`-${port}.app.github.dev`)) return false;
  const backendOrigins = [`http://localhost:${port}`, `http://127.0.0.1:${port}`];
  if (!backendOrigins.includes(headers.origin) || headers['sec-fetch-site'] !== 'same-origin') return false;
  if (![headers.host, headers['x-forwarded-host'], headers['x-original-host']].includes(expected.host)) return false;
  let referer;
  try { referer = new URL(headers.referer).origin; } catch { return false; }
  if (referer !== expected.origin && referer !== headers.origin) return false;
  headers.origin = expected.origin;
  return true;
}
module.exports = { restorePreviewRequestOrigin };
