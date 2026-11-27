import assert from "node:assert/strict";
import { fork } from "node:child_process";
import { once } from "node:events";
import { mkdtemp, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { test } from "node:test";
import { openCompanyRecordStore } from "./company-record-store.mjs";

test("native snapshot route serves pinned reads and leaves provider access scoped", { timeout: 10_000 }, async () => {
  const folder = await mkdtemp(join(tmpdir(), "traderlink-company-record-gateway-"));
  let child;
  try {
    const path = join(folder, "records.sqlite");
    const config = join(folder, "config.json");
    const token = "local-fixture-" + "a".repeat(32);
    const pcToken = "local-pc-fixture-" + "b".repeat(32);
    const store = openCompanyRecordStore(path);
    let outageRevision;
    try {
      store.reconcileRoster(1, [{ symbol: "CLRO", cik: "0000840715" }], 1000);
      const providerJobs = Array.from({ length: 2 }, () => store.claim(1001, 100, "finnhub"));
      const metrics = providerJobs.find(job => job.source === "metrics");
      const profile = providerJobs.find(job => job.source === "profile");
      assert.ok(store.complete(profile, 1002, null, "unavailable"));
      assert.ok(store.defer(metrics, 1002, 2000));
      const sec = store.claim(1003, 100, "sec");
      assert.equal(sec.source, "sec");
      assert.ok(store.complete(sec, 1004, { revenue: 0 }, "available", { historicalRevenue: 41804000 }));
      outageRevision = store.read(["CLRO"]).revision;
      const recovery = store.claim(2000, 100, "finnhub");
      assert.equal(recovery.workKey, metrics.workKey);
      assert.ok(store.complete(recovery, 2001, { yield: 0 }));
    } finally { store.close(); }
    await writeFile(config, JSON.stringify({ token, pcProfileToken: pcToken, companyRecordStore: path }), { mode: 0o600 });

    child = fork(resolve("scripts/run-company-data-gateway.mjs"), [config], {
      execArgv: ["--import", resolve("src/modules/company/server/__fixtures__/gateway-preload.mjs")],
      env: { PATH: process.env.PATH, NODE_ENV: "test" },
      stdio: ["ignore", "ignore", "ignore", "ipc"],
    });
    const upstream = [];
    const port = await new Promise((accept, reject) => {
      child.on("message", message => {
        if (message.type === "ready") accept(message.port);
        if (message.type === "upstream") upstream.push(message.kind);
      });
      child.once("exit", () => reject(new Error("Gateway subprocess exited")));
    });
    const target = `http://127.0.0.1:${port}/traderslink/v1/company/snapshots`;
    const read = (query, key = token) => fetch(target + "?" + query, { headers: { Authorization: "Bearer " + key } });
    assert.equal((await read("symbol=CLRO", pcToken)).status, 403);
    assert.equal((await read("symbol=CLRO&symbol=CLRO")).status, 400);
    assert.equal((await read("symbol=CLRO&view=detail&symbol=UNKNOWN")).status, 400);
    const [previous, latest, byDate] = await Promise.all([
      read(`symbol=CLRO&revision=${outageRevision}`).then(r => r.json()),
      read("symbol=CLRO&view=detail").then(r => r.json()),
      read("symbol=CLRO&symbol=UNKNOWN&asOf=1004").then(r => r.json()),
    ]);
    assert.equal(previous.companies[0].metrics.state, "retrying");
    assert.equal(previous.companies[0].sec.value.revenue, 0);
    assert.equal(latest.companies[0].metrics.value.yield, 0);
    assert.equal(latest.companies[0].sec.detail.historicalRevenue, 41804000);
    assert.equal(byDate.revision, outageRevision);
    assert.equal(byDate.companies[1].state, "pending");
    assert.deepEqual(upstream, []);
  } finally {
    if (child && child.exitCode === null && child.signalCode === null) {
      const exited = once(child, "exit");
      child.kill("SIGTERM");
      await exited;
    }
    await rm(folder, { recursive: true, force: true });
  }
});
