import {openPristinePlatformTestDatabase} from '@/src/test/pristine-platform-test-database';
import { removePlatformDatabaseTestFixture } from "@/src/test/platform-database-fixture";
// @vitest-environment node
import { execFileSync } from "node:child_process";
import { createServer } from "node:http";
import { once } from "node:events";
import { mkdtempSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { Worker } from "node:worker_threads";

import { JournalAccountRepository } from "../accounts/journal-account-repository";
import { createCanonicalUuidV4 } from "@/src/modules/platform/server/database/platform-migration-contract";
import { PlatformUserRepository } from "@/src/modules/platform/server/identity/platform-user-repository";
import { PlatformWorkspaceRepository } from "@/src/modules/platform/server/identity/platform-workspace-repository";

test("the packaged demo writer can wait for SQLite without blocking page reads", async () => {
  const root = mkdtempSync(join(tmpdir(), "traderlink-demo-worker-test-"));
  const databasePath = join(root, "demo.sqlite");
  const workerPath = join(root, "journal-demo-setup.cjs");
  const database = openPristinePlatformTestDatabase({ mode: "initializer", databasePath });
  const server = createServer((_request, response) => {
    const reading = database.prepare("SELECT 1 AS ready").get() as { ready: number };
    response.end(String(reading.ready));
  });
  let completion: Promise<unknown> | undefined;
  try {

    const createdAtUtc = "2026-11-16T20:00:00.000Z";
    const userId = createCanonicalUuidV4();
    const workspaceId = createCanonicalUuidV4();
    const accountId = createCanonicalUuidV4();
    new PlatformUserRepository(database, { allowedAuthProviders: ["test"] }).createUser({
      userId, authProvider: "test", authSubject: "demo-worker-owner", displayName: "Test owner",
      createdAtUtc, updatedAtUtc: createdAtUtc,
    });
    new PlatformWorkspaceRepository(database).createWorkspaceWithOwner({
      workspaceId, ownerUserId: userId, displayName: "Test workspace",
      defaultTradingTimezone: "America/Toronto", createdAtUtc,
    });
    new JournalAccountRepository(database).createAccount({
      accountId, workspaceId, displayName: "Test account", baseCurrency: "USD",
      tradingTimezone: "America/Toronto", status: "active", createdByUserId: userId,
      createdAtUtc, updatedAtUtc: createdAtUtc,
    });
    execFileSync(process.execPath, ["scripts/platform/build-journal-demo-worker.cjs", workerPath]);
    server.listen(0, "127.0.0.1");
    await once(server, "listening");
    const address = server.address();
    if (!address || typeof address === "string") throw new Error("missing test listener");

    database.exec("BEGIN IMMEDIATE");
    const worker = new Worker(workerPath, {
      env: { ...process.env, NODE_PATH: resolve("node_modules"), TRADERLINK_PLATFORM_DB_PATH: databasePath },
      workerData: {
        operation: "activate", activeAccountId: accountId,
        scope: { userId, workspaceId, workspaceRole: "owner", allowedAccountIds: [accountId], activeAccountId: accountId },
      },
    });
    let finished = false;
    const result = once(worker, "message");
    completion = once(worker, "exit").then(() => { finished = true; });
    await once(worker, "online");
    await new Promise(resolve => setTimeout(resolve, 200));
    const response = await fetch(`http://127.0.0.1:${address.port}/workspace`, { signal: AbortSignal.timeout(500) });
    expect(await response.text()).toBe("1");
    expect(finished).toBe(false);
    database.exec("COMMIT");
    const [payload] = await result;
    expect(payload).toMatchObject({ activeAccountIsDemo: false, result: { state: expect.any(String) } });
    await completion;
  } finally {
    if (database.inTransaction) database.exec("ROLLBACK");
    await completion?.catch(() => undefined);
    await new Promise<void>(done => server.close(() => done()));
    database.close();
    await removePlatformDatabaseTestFixture(root);
  }
}, 20_000);
