// @vitest-environment node
import { mkdtempSync, rmSync, copyFileSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { DatabaseSync } from "node:sqlite";
import { once } from "node:events";
import { createServer } from "node:http";
import { Worker } from "node:worker_threads";
import Database from "better-sqlite3";
import { test, expect, vi } from "vitest";
import { createHash } from "node:crypto";

vi.mock("./packs/august-2026-additions.json", async (importOriginal) => {
  type Execution = { marketCandleTimeUtcSeconds: number; priceDecimal: string };
  type Trade = { symbol: string; tradingDateNewYork: string; executions: Execution[] };
  type Bar = { time: number; openDecimal: string; highDecimal: string; lowDecimal: string; closeDecimal: string; volumeDecimal: string; turnoverDecimal: string };
  type Fixture = { trades: Trade[]; sessions: { date: string; symbol: string; normalizedBarsSha256: string; bars?: Bar[] }[] };
  const fixture = structuredClone((await importOriginal<{default:Fixture}>()).default);
  const otherTrades = [
    ...(await import("./packs/august-2026-red-additions.json")).default.trades,
    ...(await import("./packs/august-2026-red-revision-v11.json")).default.trades,
  ];
  for (const session of fixture.sessions) {
    if (session.bars) continue;
    const executions = [...fixture.trades, ...otherTrades]
      .filter(trade => trade.symbol === session.symbol && trade.tradingDateNewYork === session.date)
      .flatMap(trade => trade.executions);
    const prices = new Map(executions.map(execution => [execution.marketCandleTimeUtcSeconds, execution.priceDecimal]));
    const start = Date.parse(session.date + "T08:01:00Z") / 1000;
    let price = executions[0]!.priceDecimal;
    const format = (value: number) => value.toFixed(4).replace(/0+$/, "").replace(/[.]$/, "");
    session.bars = Array.from({ length: 960 }, (_, index) => {
      const time = start + index * 60;
      price = prices.get(time) ?? price;
      return {time, openDecimal:price, highDecimal:format(Number(price)+0.01), lowDecimal:format(Number(price)-0.01),
        closeDecimal:price, volumeDecimal:"10000000", turnoverDecimal:"0"};
    });
    session.normalizedBarsSha256 = createHash("sha256").update(JSON.stringify(session.bars) + "\n").digest("hex");
  }
  return { default: fixture };
});
import { runPlatformMigrations } from "@/src/modules/platform/server/database/run-platform-migrations";
import { PlatformUserRepository } from "@/src/modules/platform/server/identity/platform-user-repository";
import { PlatformWorkspaceRepository } from "@/src/modules/platform/server/identity/platform-workspace-repository";
import { JournalAccountRepository } from "../accounts/journal-account-repository";
import { prepareAndPublishInitialDemo } from "./journal-demo-prepared-publication";
import { JournalDemoMaterializer } from "./journal-demo-materializer";
import { resolveCurrentJournalDemoFinancialPack } from "./journal-demo-pack-contract";

function adapt(connection: DatabaseSync): Database.Database {
  let nextSavepoint = 0;
  const execute = <Output>(fn: () => Output, mode: "DEFERRED" | "IMMEDIATE" | "EXCLUSIVE"): Output => {
    const nested = connection.isTransaction;
    const name = "demo_preparation_" + nextSavepoint++;
    connection.exec(nested ? "SAVEPOINT " + name : "BEGIN " + mode);
    try {
      const output = fn();
      connection.exec(nested ? "RELEASE " + name : "COMMIT");
      return output;
    } catch (error) {
      connection.exec(nested ? "ROLLBACK TO " + name + "; RELEASE " + name : "ROLLBACK");
      throw error;
    }
  };
  return {
    exec(sql: string) { connection.exec(sql); return this; },
    pragma(sql: string, options?: {simple?:boolean}) {
      const rows = connection.prepare("PRAGMA " + sql).all();
      return options?.simple && rows.length ? Object.values(rows[0])[0] : rows;
    },
    prepare: connection.prepare.bind(connection),
    get inTransaction() { return connection.isTransaction; },
    transaction(fn: () => unknown) {
      const deferred = () => execute(fn, "DEFERRED");
      return Object.assign(deferred, {
        deferred,
        immediate: () => execute(fn, "IMMEDIATE"),
        exclusive: () => execute(fn, "EXCLUSIVE"),
      });
    },
  } as unknown as Database.Database;
}

test("publishes the prepared demo atomically while separate reads stay responsive", async () => {
  const root = mkdtempSync(join(tmpdir(), "demo-prepared-publish-"));
  const liveFile = join(root, "target.sqlite"), scratchFile=join(root, "scratch.sqlite");
  const moduleTarget = join(root, "module-target.sqlite");
  const scratchSchema = join(root, "journal-demo-schema.sqlite");
  const primaryAccountId = "10000000-0000-4000-8000-000000000005";
  const userId="10000000-0000-4000-8000-000000000001";
  const workspaceId="10000000-0000-4000-8000-000000000002";
  const now=new Date("2026-11-16T21:00:00.000Z");
  try {
    const base=new Database(liveFile);base.pragma("foreign_keys=ON");
    runPlatformMigrations(base,{now:()=>now});
    writeFileSync(scratchSchema, base.serialize());
    new PlatformUserRepository(base,{allowedAuthProviders:["test"]}).createUser({
      userId, authProvider:"test",authSubject:"synthetic-demo-prepared-publish",displayName:"Synthetic demo",
      createdAtUtc:now.toISOString(),updatedAtUtc:now.toISOString(),
    });
    new PlatformWorkspaceRepository(base).createWorkspaceWithOwner({
      workspaceId,ownerUserId:userId,displayName:"Synthetic workspace",defaultTradingTimezone:"America/New_York",
      createdAtUtc:now.toISOString(),
    });
    new JournalAccountRepository(base).createAccount({
      accountId:primaryAccountId, workspaceId, displayName:"Primary Journal", baseCurrency:"USD",
      tradingTimezone:"America/New_York", status:"active", createdByUserId:userId,
      createdAtUtc:now.toISOString(), updatedAtUtc:now.toISOString(),
    });
    const seededUserId = "10000000-0000-4000-8000-000000000003";
    const seededWorkspaceId = "10000000-0000-4000-8000-000000000004";
    new PlatformUserRepository(base, { allowedAuthProviders: ["test"] }).createUser({
      userId:seededUserId, authProvider:"test", authSubject:"synthetic-immutable-demo-inputs", displayName:"Synthetic existing demo",
      createdAtUtc:now.toISOString(), updatedAtUtc:now.toISOString(),
    });
    new PlatformWorkspaceRepository(base).createWorkspaceWithOwner({
      workspaceId:seededWorkspaceId, ownerUserId:seededUserId, displayName:"Synthetic existing workspace",
      defaultTradingTimezone:"America/New_York", createdAtUtc:now.toISOString(),
    });
    const seeded = new JournalDemoMaterializer(base, { now:()=>now })
      .materializeForWorkspace({baseCurrency:"USD", createdForUserId:seededUserId, tradingTimezone:"America/New_York", workspaceId:seededWorkspaceId});
    expect(seeded.state).toBe("materialized");
    base.pragma("journal_mode=WAL");
    base.close();
    copyFileSync(liveFile,scratchFile);
    copyFileSync(liveFile,moduleTarget);
    const moduleDatabase = new Database(moduleTarget);
    try {
      const published = prepareAndPublishInitialDemo(moduleDatabase, {
        userId, workspaceId, activeAccountId:primaryAccountId, baseCurrency:"USD", tradingTimezone:"America/New_York",
      }, scratchSchema);
      expect(published.state).toBe("materialized");
      expect(moduleDatabase.prepare("SELECT account_id FROM journal_demo_accounts WHERE workspace_id=? AND created_for_user_id=?").get(workspaceId,userId))
        .toMatchObject({account_id:published.accountId});
      expect(moduleDatabase.pragma("foreign_key_check")).toEqual([]);
    } finally { moduleDatabase.close(); }
    const scratch=new DatabaseSync(scratchFile), target=new DatabaseSync(liveFile);
    try {
      const capture=scratch.createSession();
      const started=performance.now();
      const result=new JournalDemoMaterializer(adapt(scratch),{now:()=>now,resolvePack:()=>resolveCurrentJournalDemoFinancialPack(adapt(scratch))})
        .materializeForWorkspace({baseCurrency:"USD",createdForUserId:userId,tradingTimezone:"America/New_York",workspaceId});
      expect(result.state).toBe("materialized");
      expect(result.accountId).toBeTruthy();
      const packageBytes=capture.changeset();
      capture.close();
      const preparedMs=Math.round(performance.now()-started);
      const server = createServer((_request, response) => {
        response.end(String(target.prepare("SELECT count(*) AS n FROM journal_demo_accounts WHERE workspace_id=? AND created_for_user_id=?").get(workspaceId,userId)?.n));
      });
      server.listen(0, "127.0.0.1");
      await once(server, "listening");
      const address = server.address();
      if (!address || typeof address === "string") throw Error("Missing synthetic listener");

      const publisherSource = `
        const { parentPort, workerData } = require("node:worker_threads");
        const { DatabaseSync } = require("node:sqlite");
        const db = new DatabaseSync(workerData.liveFile);
        const start = performance.now();
        db.exec("BEGIN IMMEDIATE");
        parentPort.postMessage({ publishing:true });
        try {
          const { userId, workspaceId, accountId } = workerData;
          const activeOwner = db.prepare("SELECT 1 FROM platform_workspace_memberships m JOIN platform_users u ON u.user_id=m.user_id WHERE m.workspace_id=? AND m.user_id=? AND m.role='owner' AND m.status='active' AND u.status='active'").get(workspaceId,userId);
          const clearMarker = db.prepare("SELECT 1 FROM journal_demo_lifecycle WHERE workspace_id=? AND user_id=?").get(workspaceId,userId);
          const existing = db.prepare("SELECT 1 FROM journal_demo_accounts WHERE workspace_id=? AND created_for_user_id=?").get(workspaceId,userId);
          if (!activeOwner || clearMarker || existing) throw Error("fixture scope changed");
          const tables = [];
          const conflicts = [];
          const applied = db.applyChangeset(workerData.packageBytes, {
            filter(table) {
              tables.push(table);
              return table.startsWith("journal_") && table !== "journal_demo_pack_versions" && table !== "journal_demo_lifecycle";
            },
            onConflict(type){ conflicts.push(type);return 2; },
          });
          if (!applied || tables.some(table => !table.startsWith("journal_") || table==="journal_demo_pack_versions" || table==="journal_demo_lifecycle")) {
            throw Error("Synthetic apply encountered unexpected shared writes");
          }
          const published = db.prepare("SELECT account_id FROM journal_demo_accounts WHERE workspace_id=? AND created_for_user_id=?").get(workspaceId,userId);
          if (published?.account_id !== accountId) throw Error("Synthetic scope failed after publication");
          db.exec("COMMIT");
          parentPort.postMessage({ tables, conflicts, applied, publicationMs:Math.round(performance.now()-start) });
        } catch (error) {
          if (db.isTransaction) db.exec("ROLLBACK");
          throw error;
        } finally {
          db.close();
          parentPort.close();
        }
      `;
      const workerData = { liveFile, packageBytes, userId, workspaceId, accountId: result.accountId };
      const publisher = new Worker(publisherSource, { eval: true, workerData });
      const exited = once(publisher, "exit");
      try {
        const [state] = await once(publisher, "message");
        expect(state.publishing).toBe(true);
        let finished = false;
        const completed = once(publisher, "message").then(result => {
          finished = true;
          return result;
        });
        const probes: { route:string; status:number; rows:number; ms:number }[] = [];
        while (!finished) {
          probes.push(...await Promise.all(["health","workspace","watchlist","levels"].map(async route => {
            const started = performance.now();
            const response = await fetch(`http://127.0.0.1:${address.port}/${route}`, {signal:AbortSignal.timeout(1000)});
            return {route,status:response.status,rows:Number(await response.text()),ms:Math.round(performance.now()-started)};
          })));
          await new Promise(resolve => setTimeout(resolve, 20));
        }
        const [publication] = await completed;
        expect(probes.every(probe => probe.status === 200 && (probe.rows === 0 || probe.rows === 1))).toBe(true);
        for (const route of ["health","workspace","watchlist","levels"]) {
          expect(probes.some(probe => probe.route === route && probe.rows === 0)).toBe(true);
        }
        expect(publication.applied).toBe(true);
        expect(publication.conflicts).toEqual([]);
        process.stderr.write(JSON.stringify({preparedMs,bytes:packageBytes.byteLength,probeCount:probes.length,maxProbeMs:Math.max(...probes.map(p=>p.ms)),...publication})+"\n");
      } finally {
        await exited.catch(()=>{});
        await new Promise<void>(done=>server.close(()=>done()));
      }
      expect(target.prepare("PRAGMA foreign_key_check").all()).toHaveLength(0);
      const tableNames=target.prepare("SELECT name FROM sqlite_schema WHERE type='table' AND name NOT LIKE 'sqlite_%' ORDER BY name").all();
      for (const row of tableNames) {
        const name=String(row.name);
        expect(name).toMatch(/^[a-z0-9_]+$/u);
        const digest=(db:DatabaseSync)=>createHash("sha256")
          .update(db.prepare('SELECT * FROM "'+name+'"').all().map(value=>JSON.stringify(value)).sort().join("\n")).digest("hex");
        expect(digest(target),name).toBe(digest(scratch));
      }
      expect(target.prepare("SELECT count(*) AS n FROM journal_demo_accounts").get()?.n).toBe(2);
      expect(target.prepare("SELECT count(*) AS n FROM journal_round_trips WHERE lifecycle_state='active' AND workspace_id=?").get(workspaceId)?.n).toBe(170);

      const duplicate = new Worker(publisherSource, { eval: true, workerData });
      const rejected = new Promise<Error>(resolve => duplicate.once("error", resolve));
      const duplicateExit = new Promise<number>(resolve => duplicate.once("exit", resolve));
      expect((await rejected).message).toBe("fixture scope changed");
      expect(await duplicateExit).toBe(1);
      expect(target.prepare("SELECT count(*) AS n FROM journal_demo_accounts").get()?.n).toBe(2);
    } finally { scratch.close();target.close(); }
  } finally {rmSync(root,{recursive:true,force:true});}
}, 60_000);
