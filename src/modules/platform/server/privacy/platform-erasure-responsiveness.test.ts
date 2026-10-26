// @vitest-environment node
import Database from "better-sqlite3";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { Worker } from "node:worker_threads";
import { createServer } from "node:http";
import { once } from "node:events";
import { expect, it } from "vitest";

it("serves unrelated loopback reads while the actual rooted deletion worker holds an immediate transaction", async () => {
  const root = mkdtempSync(join(tmpdir(), "traderlink-erasure-responsive-"));
  const databasePath = join(root, "synthetic.sqlite");
  const db = new Database(databasePath);
  let worker: Worker | undefined;
  const server = createServer((_request, response) => {
    const row = db.prepare("SELECT value FROM unrelated WHERE id=1").get() as { value: string };
    response.end(row.value);
  });
  try {
    db.pragma("journal_mode=WAL"); db.pragma("foreign_keys=ON");
    db.exec(`CREATE TABLE roots(id TEXT PRIMARY KEY); INSERT INTO roots VALUES('target');
      CREATE TABLE child(id INTEGER PRIMARY KEY, root TEXT REFERENCES roots(id)); INSERT INTO child VALUES(1,'target');
      CREATE TABLE unrelated(id INTEGER PRIMARY KEY,value TEXT); INSERT INTO unrelated VALUES(1,'ready');`);
    const source = `
      require('tsx/cjs');
      const {parentPort,workerData}=require('node:worker_threads');
      const Database=require('better-sqlite3');
      const {captureErasureClosure}=require(workerData.source);
      const db=new Database(workerData.databasePath);db.pragma('foreign_keys=ON');
      db.transaction(()=>{
        db.pragma('defer_foreign_keys=ON');
        const closure=captureErasureClosure(db,[{table:'roots',column:'id',value:'target'}]);
        parentPort.postMessage('writer_active');
        // Synthetic long synchronous I/O equivalent, entirely on the worker.
        Atomics.wait(new Int32Array(new SharedArrayBuffer(4)),0,0,600);
        closure.deleteRows();closure.dispose();
        if(db.pragma('foreign_key_check').length)throw Error('integrity');
      }).immediate();db.close();parentPort.close();
    `;
    server.listen(0, "127.0.0.1"); await once(server, "listening");
    worker = new Worker(source, { eval: true, workerData: {
      databasePath, source: resolve("src/modules/platform/server/privacy/platform-erasure-closure.ts"),
    } });
    const exited = once(worker, "exit");
    const [phase] = await once(worker, "message"); expect(phase).toBe("writer_active");
    const address = server.address(); if (!address || typeof address === "string") throw new Error("synthetic_listener");
    const started = performance.now();
    for (let n = 0; n < 3; n++) {
      const response = await fetch(`http://127.0.0.1:${address.port}/synthetic-health`);
      expect(await response.text()).toBe("ready");
    }
    expect(performance.now() - started).toBeLessThan(500);
    const [exitCode] = await exited; expect(exitCode).toBe(0);
    expect(db.prepare("SELECT COUNT(*) AS n FROM roots").get()).toEqual({ n: 0 });
  } finally {
    // Never terminate an in-progress writer, including test failure cleanup.
    if (worker && worker.threadId !== -1) await once(worker, "exit");
    await new Promise<void>((done) => server.close(() => done()));
    db.close(); rmSync(root, { recursive: true, force: true });
  }
});
