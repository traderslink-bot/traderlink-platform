const assert = require("node:assert/strict");
const { randomBytes, randomUUID, createHash } = require("node:crypto");
const fs = require("node:fs");
const path = require("node:path");
const { spawn, execFileSync } = require("node:child_process");
const https = require("node:https");
const http = require("node:http");
const net = require("node:net");
const { networkInterfaces } = require("node:os");

const ORIGIN = "https://127.0.0.1:3102";
const ACCOUNT = "SYNTH-LEVEL-FACTS";
const SUBJECT = "123456789012345678";
const GUILD = "123456789012345679";
const root = process.cwd();
const load = file => require(path.join(root, file));

function privateJson(file, value) {
  fs.writeFileSync(file, JSON.stringify(value), { mode: 0o600, flag: "wx" });
}

function fixtureEnvironment(storageRoot) {
  const key = () => JSON.stringify({ e2e: randomBytes(32).toString("base64") });
  return {
    NODE_ENV: "production",
    TRADERLINK_PLATFORM_STORAGE_BACKEND: "sqlite_single_node",
    RAILWAY_VOLUME_MOUNT_PATH: storageRoot,
    TRADERLINK_PLATFORM_DB_PATH: path.join(storageRoot, "traderlink-platform.sqlite"),
    TRADERLINK_PLATFORM_JOURNAL_EVIDENCE_VAULT_ROOT: path.join(storageRoot, "evidence-vault"),
    TRADERLINK_PLATFORM_JOURNAL_UPLOAD_STAGING_ROOT: path.join(storageRoot, "upload-staging"),
    TRADERLINK_PLATFORM_HOSTED_BACKUP_ROOT: path.join(storageRoot, "backups"),
    TRADERLINK_PLATFORM_JOURNAL_PROTECTED_STORAGE_ROOTS_JSON: JSON.stringify([path.join(storageRoot, "backups")]),
    TRADERLINK_PLATFORM_JOURNAL_HMAC_ACTIVE_KEY_VERSION: "e2e",
    TRADERLINK_PLATFORM_JOURNAL_HMAC_KEYS_JSON: key(),
    TRADERLINK_PLATFORM_ACCOUNT_IDENTITY_ACTIVE_KEY_VERSION: "e2e",
    TRADERLINK_PLATFORM_ACCOUNT_IDENTITY_HMAC_KEYS_JSON: key(),
    TRADERLINK_PLATFORM_ADMIN_RATE_LIMIT_SECRET: randomBytes(32).toString("hex"),
    TRADERLINK_PLATFORM_APPLICATION_VERSION: "isolated-level-facts-browser-test",
    TRADERLINK_PLATFORM_PUBLIC_ORIGIN: ORIGIN,
    TRADERLINK_LEVEL_ANALYSIS_ALLOWED_PROVIDERS: "ibkr,fixture",
    TRADERLINK_PLATFORM_INITIAL_OWNER_DISCORD_SUBJECT: SUBJECT,
    DISCORD_GUILD_ID: GUILD,
    TRADERSLINK_PREMIUM_DISCORD_ROLE_ID: "123456789012345680",
  };
}

function prepareFixture(storageRoot, controlRoot) {
  assert(path.isAbsolute(storageRoot) && path.isAbsolute(controlRoot));
  const stat = fs.lstatSync(storageRoot);
  assert(stat.isDirectory() && !stat.isSymbolicLink() && stat.uid === process.getuid());
  assert.equal(fs.readFileSync(path.join(storageRoot, ".level-analysis-e2e-owner"), "utf8").trim(), process.env.LEVEL_ANALYSIS_E2E_RUN_ID);
  assert(!fs.existsSync(path.join(storageRoot, "traderlink-platform.sqlite")), "Refusing existing storage");
  fs.mkdirSync(controlRoot, { recursive: true, mode: 0o700 });
  for (const name of ["evidence-vault", "upload-staging", "backups"]) {
    fs.mkdirSync(path.join(storageRoot, name), { mode: 0o700 });
  }
  const environment = fixtureEnvironment(storageRoot);
  Object.assign(process.env, environment);
  const { openPlatformDatabase } = load("src/modules/platform/server/database/open-platform-database.ts");
  const { runPlatformMigrations } = load("src/modules/platform/server/database/run-platform-migrations.ts");
  const { PlatformDiscordSignInService } = load("src/modules/platform/server/authentication/platform-discord-sign-in-service.ts");
  const { PlatformOperatorRepository } = load("src/modules/platform/server/administration/platform-operator-repository.ts");
  const { JournalDemoAccountRepository } = load("src/modules/journal/server/demo/journal-demo-account-repository.ts");
  const { JournalAccountRepository } = load("src/modules/journal/server/accounts/journal-account-repository.ts");
  const { JournalAccountService, loadAccountIdentityConfiguration } = load("src/modules/journal/server/accounts/journal-account-service.ts");
  const { IBKR_SOURCE_ACCOUNT_CANONICALIZERS, IBKR_SOURCE_ACCOUNT_CANONICALIZATION_VERSION } = load("src/modules/journal/server/accounts/ibkr-source-account-canonicalizer.ts");
  const { deriveJournalAccountSelectionRef } = load("src/modules/platform/contracts/journal-account-selection.ts");
  const database = openPlatformDatabase({ mode: "initializer", databasePath: environment.TRADERLINK_PLATFORM_DB_PATH });
  let metadata;
  try {
    runPlatformMigrations(database);
    // Same native synthetic sign-in and singleton grant flow as the auth tests.
    const signed = new PlatformDiscordSignInService(database).signIn({
      authSubject: SUBJECT, username: "synthetic-level-facts", globalDisplayName: "Synthetic Level Facts",
      avatarHash: null, guildId: GUILD, roleIds: [], guildOwner: true, joinedAtUtc: null,
    }, { deferDemoActivation: true });
    new PlatformOperatorRepository(database).insert({
      operatorGrantId: randomUUID(), userId: signed.userId, grantedByKind: "bootstrap_console",
      grantedByUserId: null, grantReceiptSha256: createHash("sha256").update(randomBytes(32)).digest("hex"),
      recoveryOfGrantId: null, grantedAtUtc: new Date().toISOString(),
    });
    const accountId = signed.allowedAccountIds[0];
    assert(accountId);
    const scope = { userId: signed.userId, workspaceId: signed.workspaceId, workspaceRole: "owner",
      allowedAccountIds: signed.allowedAccountIds, activeAccountId: accountId };
    new JournalAccountService(new JournalAccountRepository(database), loadAccountIdentityConfiguration(
      environment, IBKR_SOURCE_ACCOUNT_CANONICALIZERS, IBKR_SOURCE_ACCOUNT_CANONICALIZATION_VERSION,
    )).confirmSourceIdentityLinkRecord(scope, { accountId, sourceSystem: "ibkr", rawSourceAccountId: ACCOUNT,
      privacySafeDisplay: "Synthetic account", now: new Date() });
    // This test models an existing owner who previously cleared Demo, not
    // first-time onboarding. The historical UUID is synthetic fixture state;
    // no actual demo materialization or erasure is claimed by this regression.
    const demos = new JournalDemoAccountRepository(database);
    demos.recordClearedLifecycle({ userId: scope.userId, workspaceId: scope.workspaceId,
      clearedDemoAccountId: randomUUID(), clearedAtUtc: new Date().toISOString() });
    assert.equal(demos.findLifecycleForUser(scope)?.state, "cleared");
    assert.equal(demos.findAccountForUser(scope), null);
    assert.equal(database.prepare("SELECT count(*) AS count FROM journal_executions WHERE workspace_id=?")
      .get(scope.workspaceId).count, 0, "Browser Upload must create the executions");
    const primary = new JournalAccountService(new JournalAccountRepository(database))
      .requireAccountRecord(scope, accountId);
    assert.equal(primary.displayName, "Primary Journal");
    metadata = { runId: process.env.LEVEL_ANALYSIS_E2E_RUN_ID, sourceAccount: ACCOUNT, scenario: "synthetic_existing_owner_prior_cleared_demo_empty_primary_journal",
      scope, databasePath: environment.TRADERLINK_PLATFORM_DB_PATH,
      expectedAccountSelectionRef: deriveJournalAccountSelectionRef(signed.workspaceId, accountId) };
    const sessionCookie = { name: "__Host-tl_platform_session", value: signed.session.token,
      domain: "127.0.0.1", path: "/", expires: -1, httpOnly: true, secure: true, sameSite: "Lax" };
    const saveAttempt = (directory, attempt) => {
      fs.mkdirSync(directory, { recursive: true, mode: 0o700 });
      privateJson(path.join(directory, "metadata.json"), attempt);
      privateJson(path.join(directory, "browser-state.json"), { cookies: [sessionCookie, {
        name: "traderlink_journal_account", value: attempt.expectedAccountSelectionRef,
        domain: "127.0.0.1", path: "/", expires: -1, httpOnly: true, secure: true, sameSite: "Strict",
      }], origins: [] });
    };
    saveAttempt(controlRoot, metadata);
    // Playwright has one retry. Give it its own genuine empty account, rather
    // than weakening four-new-fill assertions after a partially successful run.
    const retryAccountId = randomUUID(), timestamp = new Date().toISOString();
    new JournalAccountRepository(database).createAccount({ accountId: retryAccountId,
      workspaceId: scope.workspaceId, displayName: "Retry Journal", baseCurrency: "USD",
      tradingTimezone: "America/New_York", status: "active", createdByUserId: scope.userId,
      createdAtUtc: timestamp, updatedAtUtc: timestamp });
    const retryScope = { ...scope, activeAccountId: retryAccountId,
      allowedAccountIds: [...scope.allowedAccountIds, retryAccountId] };
    const sourceAccount = ACCOUNT + "-RETRY-1";
    new JournalAccountService(new JournalAccountRepository(database), loadAccountIdentityConfiguration(
      environment, IBKR_SOURCE_ACCOUNT_CANONICALIZERS, IBKR_SOURCE_ACCOUNT_CANONICALIZATION_VERSION,
    )).confirmSourceIdentityLinkRecord(retryScope, { accountId: retryAccountId, sourceSystem: "ibkr",
      rawSourceAccountId: sourceAccount, privacySafeDisplay: "Synthetic retry account", now: new Date() });
    assert.equal(database.prepare("SELECT count(*) AS count FROM journal_executions WHERE workspace_id=? AND account_id=?")
      .get(scope.workspaceId, retryAccountId).count, 0);
    saveAttempt(path.join(controlRoot, "retry-1"), { ...metadata, scope: retryScope, sourceAccount,
      expectedAccountSelectionRef: deriveJournalAccountSelectionRef(scope.workspaceId, retryAccountId) });
  } finally { database.close(); }
  return { environment, metadata };
}

function readTrade(controlRoot) {
  const metadata = JSON.parse(fs.readFileSync(path.join(controlRoot, "metadata.json"), "utf8"));
  const { openReadonlyPlatformDatabase } = load("src/modules/platform/server/database/open-readonly-platform-database.ts");
  const database = openReadonlyPlatformDatabase({ databasePath: metadata.databasePath,
    environment: { NODE_ENV: "production", TRADERLINK_PLATFORM_STORAGE_BACKEND: "sqlite_single_node" } });
  try {
    const rows = database.prepare(`SELECT r.round_trip_id AS id, i.normalized_symbol AS symbol,
      v.projection_state AS state FROM journal_round_trips r
      JOIN journal_round_trip_versions v ON v.round_trip_version_id=r.current_version_id
      JOIN journal_instruments i ON i.instrument_id=v.instrument_id AND i.workspace_id=v.workspace_id
      WHERE r.workspace_id=? AND r.account_id=? AND r.lifecycle_state='active'`).all(
      metadata.scope.workspaceId, metadata.scope.activeAccountId);
    assert.equal(rows.length, 1);
    assert.equal(rows[0].symbol, "DEVS");
    assert.equal(rows[0].state, "ready_closed");
    return rows[0];
  } finally { database.close(); }
}

// Kernel boundary for the entire browser process tree, not a worker bypass.
function writeTradeResult(controlRoot) {
  const metadata = JSON.parse(fs.readFileSync(path.join(controlRoot, "metadata.json"), "utf8"));
  assert.equal(metadata.runId, process.env.LEVEL_ANALYSIS_E2E_RUN_ID, "Wrong fixture run");
  const trade = readTrade(controlRoot);
  privateJson(path.join(controlRoot, "trade-result.json"), {
    protocol: "level-facts-trade-result-v1", runId: metadata.runId,
    workspaceId: metadata.scope.workspaceId, accountId: metadata.scope.activeAccountId,
    expectedAccountSelectionRef: metadata.expectedAccountSelectionRef, trade,
  });
}

async function verifyNetworkIsolation() {
  const status = fs.readFileSync("/proc/self/status", "utf8");
  assert(process.getuid() !== 0 && /^CapEff:\s+0+$/m.test(status)
    && /^NoNewPrivs:\s+1$/m.test(status),
    "Browser tests must drop root/capabilities and forbid privilege escalation");
  const outside = process.env.LEVEL_ANALYSIS_E2E_HOST_NETWORK_NAMESPACE;
  const current = fs.readlinkSync("/proc/self/ns/net");
  assert(/^net:\[[0-9]+\]$/.test(outside ?? "") && current !== outside,
    "Browser tests must run in their own network namespace");
  const addresses = Object.values(networkInterfaces()).flat().filter(Boolean);
  assert(addresses.length > 0 && addresses.every(address => address.internal),
    "Only loopback may be available to browser tests");
  for (const host of ["192.0.2.1", "2001:db8::1"]) {
    await new Promise((resolve, reject) => {
      const socket = net.createConnection({ host, port: 443 });
      socket.once("connect", () => { socket.destroy(); reject(new Error("External network was reachable")); });
      socket.once("error", error => {
        socket.destroy();
        if (["ENETUNREACH", "EHOSTUNREACH", "ENETDOWN"].includes(error.code)) resolve();
        else reject(error);
      });
    });
  }
  return { unprivileged: true, noNewPrivileges: true, separateNamespace: true, loopbackOnly: true, ipv4Egress: "blocked", ipv6Egress: "blocked" };
}

async function serve() {
  const controlRoot = process.env.LEVEL_ANALYSIS_E2E_CONTROL_ROOT;
  assert(controlRoot && process.env.LEVEL_ANALYSIS_E2E_RUN_ID);
  assert(!Object.keys(process.env).some(key => /^RAILWAY_(PROJECT|SERVICE|ENVIRONMENT|DEPLOYMENT)_ID$/.test(key)), "Refusing hosted execution");
  await verifyNetworkIsolation();
  const { environment } = prepareFixture("/data", controlRoot);
  const cert = path.join(controlRoot, "test-cert.pem"), key = path.join(controlRoot, "test-key.pem");
  execFileSync("openssl", ["req", "-x509", "-newkey", "rsa:2048", "-nodes", "-days", "1",
    "-subj", "/CN=127.0.0.1", "-addext", "subjectAltName=IP:127.0.0.1", "-keyout", key, "-out", cert], { stdio: "ignore" });
  fs.chmodSync(key, 0o600);
  // No provider, delivery, Railway or real account credentials pass to this child.
  const inherited = Object.fromEntries(["PATH", "LANG", "TZ", "CI", "NODE_OPTIONS", "NODE_DISABLE_COMPILE_CACHE", "TSX_DISABLE_CACHE"]
    .filter(name => process.env[name] !== undefined).map(name => [name, process.env[name]]));
  const child = spawn(process.execPath, ["node_modules/next/dist/bin/next", "start", "--hostname", "127.0.0.1", "--port", "3101"], {
    cwd: root, env: { ...inherited, ...environment, NODE_DISABLE_COMPILE_CACHE: "1", TSX_DISABLE_CACHE: "1", NEXT_TELEMETRY_DISABLED: "1" }, stdio: "inherit",
  });
  const proxy = https.createServer({ key: fs.readFileSync(key), cert: fs.readFileSync(cert) }, (request, response) => {
    const upstream = http.request({ hostname: "127.0.0.1", port: 3101, path: request.url, method: request.method,
      headers: { ...request.headers, host: "127.0.0.1:3102", "x-forwarded-host": "127.0.0.1:3102", "x-forwarded-proto": "https" } }, remote => {
      response.writeHead(remote.statusCode, remote.headers); remote.pipe(response);
    });
    upstream.on("error", () => { response.writeHead(503); response.end("Test server starting"); });
    request.pipe(upstream);
  });
  proxy.listen(3102, "127.0.0.1");
  child.on("exit", code => { proxy.close(); process.exitCode = code ?? 1; });
  for (const signal of ["SIGTERM", "SIGINT"]) process.on(signal, () => { proxy.close(); child.kill(signal); });
}

module.exports = { prepareFixture, readTrade, writeTradeResult, verifyNetworkIsolation };
if (require.main === module) {
  if (process.argv[2] === "trade") writeTradeResult(process.argv[3]);
  else serve().catch(error => { console.error(error); process.exitCode = 1; });
}
