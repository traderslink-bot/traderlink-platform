import "server-only";
import { spawn } from "node:child_process";
import { createHash } from "node:crypto";
import { statSync } from "node:fs";
import { join } from "node:path";
import { PRESS_RELEASE_CHANNELS, type PressReleaseUnreadCounts } from "../contracts/press-release-dashboard-contracts";

type Plan = Readonly<{ sql: string; parameters: readonly (string | number)[] }>;
type Result = Readonly<{ counts: PressReleaseUnreadCounts; durationMs: number; readBytes: number | null }>;
type HeadlineRow = Readonly<{ id: string; ticker: string; headline: string; is_read: 0 | 1; published_at?: string }>;
type HeadlineQueryResult = Readonly<{ rows: readonly HeadlineRow[]; durationMs: number; readBytes: number | null }>;
type HeadlineResult = HeadlineQueryResult & Readonly<{ queueMs: number; childMs: number }>;
type JobBase = { key: string; databasePath: string; plan: Plan; reject: (error: Error) => void;
  deadline: ReturnType<typeof setTimeout>; expired: boolean; expiresAt: number };
type UnreadJob = JobBase & { kind: "unread"; promise: Promise<Result>; resolve: (value: Result) => void };
type HeadlineJob = JobBase & { kind: "scanner"; promise: Promise<HeadlineResult>; resolve: (value: HeadlineResult) => void;
  limit: 6 | 60; includePublishedAt: boolean; queuedAt: number };
type Job = UnreadJob | HeadlineJob;
type State = { active: boolean; jobs: Map<string, Job>; queue: Job[]; lastWarningAt: number };
const processState = globalThis as typeof globalThis & { __traderlinkUnreadChild?: State };
const state: State = processState.__traderlinkUnreadChild ??= { active: false, jobs: new Map(), queue: [], lastWarningAt: 0 };

// IPC is private to this parent. No HTTP input supplies SQL, a path or a user binding.
const source = String.raw`
process.once("message", input => {
  let db;
  try {
    const fs = require("node:fs");
    const identity = fs.statSync(input.databasePath);
    if (identity.dev !== input.device || identity.ino !== input.inode) throw Error();
    const Database = require(input.modulePath);
    db = new Database(input.databasePath, { readonly: true, fileMustExist: true, timeout: 1000 });
    db.pragma("query_only=ON"); db.pragma("busy_timeout=1000");
    db.pragma("cache_size=-1024");
    const readBytes = () => {
      try { return Number(/^read_bytes:\s*(\d+)/m.exec(fs.readFileSync("/proc/self/io", "utf8"))[1]); }
      catch { return null; }
    };
    const before = readBytes(), started = performance.now();
    const result = input.kind === "scanner"
      ? db.prepare(input.plan.sql).all(...input.plan.parameters)
      : db.prepare(input.plan.sql).get(...input.plan.parameters);
    const durationMs = performance.now() - started, after = readBytes();
    db.close(); db = null;
    const current = fs.statSync(input.databasePath);
    if (current.dev !== input.device || current.ino !== input.inode) throw Error();
    process.send({ ...(input.kind === "scanner" ? { rows: result } : { counts: result }),
      durationMs, readBytes: before === null || after === null ? null : Math.max(0, after-before) }, () => process.disconnect());
  } catch { try { db?.close(); } catch {} process.exitCode = 1; process.disconnect(); }
});
`;

function valid(value: unknown): value is Result {
  if (!value || typeof value !== "object") return false;
  const result = value as Result;
  return Boolean(result.counts && typeof result.counts === "object" &&
    PRESS_RELEASE_CHANNELS.every(channel => Number.isSafeInteger(result.counts[channel]) && result.counts[channel] >= 0) &&
    Number.isFinite(result.durationMs) && result.durationMs >= 0 &&
    (result.readBytes === null || Number.isSafeInteger(result.readBytes) && result.readBytes >= 0));
}

function validHeadlineResult(value: unknown, job: HeadlineJob): value is HeadlineQueryResult {
  if (!value || typeof value !== "object") return false;
  const result = value as HeadlineQueryResult;
  const text = (item: unknown, maximum: number): item is string => typeof item === "string" &&
    item.length > 0 && item.length <= maximum * 2 && !item.includes("\0") && Array.from(item).length <= maximum;
  const keys = job.includePublishedAt ? ["headline", "id", "is_read", "published_at", "ticker"] : ["headline", "id", "is_read", "ticker"];
  return Boolean(Array.isArray(result.rows) && result.rows.length <= job.limit && result.rows.every(row =>
    row && typeof row === "object" && !Array.isArray(row) &&
    JSON.stringify(Object.keys(row).sort()) === JSON.stringify(keys) &&
    text(row.id, 64) && text(row.ticker, 32) && text(row.headline, 1000) &&
    (row.is_read === 0 || row.is_read === 1) &&
    (!job.includePublishedAt || typeof row.published_at === "string" &&
      /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/.test(row.published_at))) &&
    Number.isFinite(result.durationMs) && result.durationMs >= 0 &&
    (result.readBytes === null || Number.isSafeInteger(result.readBytes) && result.readBytes >= 0));
}

function unavailable(job: Job): Error {
  return new Error(job.kind === "unread" ? "unread_counts_temporarily_unavailable" : "scanner_temporarily_unavailable");
}

function pump(): void {
  if (state.active) return;
  const job = state.queue.shift();
  if (!job) return;
  if (job.expired) { pump(); return; }
  state.active = true;
  let result: unknown;
  let failed = false;
  let child: ReturnType<typeof spawn> | undefined;
  const childStartedAt = performance.now();
  try {
    // The pinned npm/standalone Docker layout places this native package here.
    // Pass an absolute package directory: webpack must not resolve it to an ID.
    const modulePath = join(process.cwd(), "node_modules", "better-sqlite3");
    if (!statSync(modulePath).isDirectory()) throw new Error("unread_counts_temporarily_unavailable");
    const identity = statSync(job.databasePath);
    const remaining = job.expiresAt - Date.now();
    if (remaining <= 0) throw new Error("unread_counts_temporarily_unavailable");
    const processHandle = spawn(process.execPath, ["--max-old-space-size=96", "-e", source], {
      stdio: ["ignore", "ignore", "ignore", "ipc"],
      env: { NODE_ENV: "production", PATH: process.env.PATH ?? "" },
    });
    child = processHandle;
    const limit = setTimeout(() => { failed = true; processHandle.kill("SIGKILL"); }, Math.min(20_000, remaining));
    limit.unref();
    processHandle.once("error", () => { failed = true; });
    processHandle.once("message", value => {
      if (job.kind === "scanner" ? validHeadlineResult(value, job) : valid(value)) result = value;
      else { failed = true; processHandle.kill("SIGKILL"); }
    });
    processHandle.once("close", code => {
      clearTimeout(limit); clearTimeout(job.deadline);
      state.active = false; state.jobs.delete(job.key);
      if (!job.expired && !failed && code === 0 && result) {
        if (job.kind === "scanner" && validHeadlineResult(result, job)) {
          job.resolve({ ...result, queueMs: Math.max(0, childStartedAt - job.queuedAt),
            childMs: Math.max(0, performance.now() - childStartedAt) });
        } else if (job.kind === "unread" && valid(result)) {
          if (result.durationMs > 1000 && Date.now() - state.lastWarningAt > 60_000) {
            state.lastWarningAt = Date.now();
            try { console.info("TraderLink background unread query.", { durationMs: Number(result.durationMs.toFixed(1)), readBytes: result.readBytes }); }
            catch { /* Diagnostics never prevent completion or release of the child slot. */ }
          }
          job.resolve(result);
        } else job.reject(unavailable(job));
      } else job.reject(unavailable(job));
      // Never start another SQLite child until the old native process has CLOSED.
      pump();
    });
    processHandle.send({ kind: job.kind, databasePath: job.databasePath, device: identity.dev, inode: identity.ino,
      modulePath, plan: job.plan }, error => {
      if (error) { failed = true; processHandle.kill("SIGKILL"); }
    });
  } catch {
    if (child) { failed = true; child.kill("SIGKILL"); return; }
    clearTimeout(job.deadline); state.jobs.delete(job.key); state.active = false;
    job.reject(unavailable(job)); pump();
  }
}

/** One readonly child, two queued jobs, 30s total lifetime; same-scope inflight dedup only. */
export function readUnreadCountsInChild(databasePath: string, plan: Plan): Promise<Result> {
  const key = createHash("sha256").update(JSON.stringify([databasePath, plan])).digest("hex");
  const existing = state.jobs.get(key);
  if (existing) return existing.kind === "unread" ? existing.promise : Promise.reject(new Error("unread_counts_temporarily_unavailable"));
  if (state.jobs.size >= 3) return Promise.reject(new Error("unread_counts_temporarily_unavailable"));
  let resolve!: UnreadJob["resolve"], reject!: UnreadJob["reject"];
  const promise = new Promise<Result>((yes, no) => { resolve = yes; reject = no; });
  const job: UnreadJob = { kind: "unread", key, databasePath, plan, promise, resolve, reject, expired: false, expiresAt: Date.now() + 30_000,
    deadline: setTimeout(() => {
      job.expired = true; reject(new Error("unread_counts_temporarily_unavailable"));
      // Active jobs retain their slot until process close; queued jobs can be removed.
      if (state.queue.includes(job)) { state.queue = state.queue.filter(item => item !== job); state.jobs.delete(key); }
    }, 30_000),
  };
  job.deadline.unref(); state.jobs.set(key, job); state.queue.push(job); pump();
  return promise;
}

/** Same single child lane as unread counts; no completed cache or second process. */
export function readScannerHeadlinesInChild(databasePath: string, plan: Plan,
  options: Readonly<{ limit: 6 | 60; includePublishedAt: boolean }>): Promise<HeadlineResult> {
  if (![6, 60].includes(options.limit) || typeof options.includePublishedAt !== "boolean") {
    return Promise.reject(new Error("scanner_temporarily_unavailable"));
  }
  const key = createHash("sha256").update(JSON.stringify([databasePath, plan, "scanner", options])).digest("hex");
  const existing = state.jobs.get(key);
  if (existing) return existing.kind === "scanner" ? existing.promise : Promise.reject(new Error("scanner_temporarily_unavailable"));
  if (state.jobs.size >= 3) return Promise.reject(new Error("scanner_temporarily_unavailable"));
  let resolve!: HeadlineJob["resolve"], reject!: HeadlineJob["reject"];
  const promise = new Promise<HeadlineResult>((yes, no) => { resolve = yes; reject = no; });
  const job: HeadlineJob = { kind: "scanner", key, databasePath, plan, promise, resolve, reject, ...options,
    queuedAt: performance.now(), expired: false, expiresAt: Date.now() + 30_000,
    deadline: setTimeout(() => {
      job.expired = true; reject(new Error("scanner_temporarily_unavailable"));
      if (state.queue.includes(job)) { state.queue = state.queue.filter(item => item !== job); state.jobs.delete(key); }
    }, 30_000),
  };
  job.deadline.unref(); state.jobs.set(key, job); state.queue.push(job); pump();
  return promise;
}
