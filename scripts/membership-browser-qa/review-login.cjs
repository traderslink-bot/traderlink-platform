// Synthetic Codespaces review entrypoint. Never imported by application routes.
const fs = require('node:fs'), path = require('node:path'), assert = require('node:assert/strict');
module.exports = function reviewLogin() {
  assert.equal(process.env.MEMBERSHIP_QA_REVIEW, '1');
  const fixture = JSON.parse(fs.readFileSync(process.env.MEMBERSHIP_QA_FIXTURE, 'utf8'));
  assert(fixture.dir.startsWith('/workspaces/private-data/membership-qa-fixtures/run-'));
  assert.equal(process.env.TRADERLINK_PLATFORM_DB_PATH, path.join(fixture.dir, 'qa.sqlite'));
  const origin = process.env.TRADERLINK_PLATFORM_PUBLIC_ORIGIN;
  const publicHost = new URL(origin).host;
  const safeOrigin = value => { try { return new URL(value).origin; } catch { return null; } };
  const Database = require('better-sqlite3');
  let refreshed = 0;
  return function handle(request, response) {
    // Codespaces rewrites Origin/Host to localhost but preserves the public
    // forwarded host and browser Referer. Restore only this exact same-origin
    // synthetic review request, including Next Server Actions. Never accept a
    // foreign/absent Referer or cross-site browser request as proof of origin.
    if (request.method === 'POST' && request.headers.origin === 'http://localhost:3027' &&
      request.headers.host === 'localhost:3027' && request.headers['x-forwarded-host'] === publicHost &&
      safeOrigin(request.headers.referer) === origin && request.headers['sec-fetch-site'] === 'same-origin') {
      request.headers.origin = origin;
    }
    if (Date.now() - refreshed > 60000) {
      const db = new Database(fixture.env.TRADERLINK_PLATFORM_DB_PATH);
      try { db.prepare('UPDATE platform_discord_memberships SET last_verified_at_utc=? WHERE user_id=? AND guild_id=?')
        .run(new Date().toISOString(), fixture.users.owner.userId, fixture.env.DISCORD_GUILD_ID); }
      finally { db.close(); }
      refreshed = Date.now();
    }
    const pathname = new URL(request.url, origin).pathname;
    if (!pathname.startsWith('/__membership-qa')) return false;
    response.setHeader('Cache-Control', 'private, no-store');
    response.setHeader('X-Robots-Tag', 'noindex, nofollow');
    if (pathname === '/__membership-qa' && request.method === 'GET') {
      response.setHeader('Content-Type', 'text/html; charset=utf-8');
      response.end(`<!doctype html><html><head><meta name="viewport" content="width=device-width"><title>Membership review — Codespaces</title></head><body style="font:16px system-ui;max-width:620px;margin:60px auto;padding:24px;background:#0e1520;color:white"><h1>Membership editor review</h1><p>This is the private Codespaces preview with disposable synthetic accounts. No customer data, real payments, AI calls or notifications are connected.</p><p>Open the owner editor to create a plan. Member A and B can review published plans. Application labels may say Production because this preview uses the compiled build; this is still the synthetic Codespaces database.</p><form method="post" action="/__membership-qa/login">${['owner','A','B'].map(role => `<button style="padding:12px;margin:6px" name="role" value="${role}">${role === 'owner' ? 'Review as owner' : 'Review as member ' + role}</button>`).join('')}</form></body></html>`);
      return true;
    }
    if (pathname !== '/__membership-qa/login' || request.method !== 'POST' || request.headers.origin !== origin) {
      console.log('Synthetic review login rejected', JSON.stringify({method:request.method,
        origin:safeOrigin(request.headers.origin),refererOrigin:safeOrigin(request.headers.referer),
        host:request.headers.host,forwardedHost:request.headers['x-forwarded-host'],
        fetchSite:request.headers['sec-fetch-site']}));
      response.writeHead(403); response.end('Review access denied'); return true;
    }
    let body = '';
    request.on('data', chunk => { body += chunk; if (body.length > 256) request.destroy(); });
    request.on('end', () => {
      const role = new URLSearchParams(body).get('role');
      if (!['owner','A','B'].includes(role)) { response.writeHead(400); response.end('Choose a synthetic account'); return; }
      response.setHeader('Set-Cookie', `tl_platform_session=${fixture.users[role].token}; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=7200`);
      response.writeHead(303, {Location:role === 'owner' ? '/admin/journal/memberships?section=Plans' : '/plans'});
      response.end();
    });
    return true;
  };
};
