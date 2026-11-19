// @vitest-environment node
import Database from "better-sqlite3";
import { afterEach, expect, it, vi } from "vitest";
const fixture = vi.hoisted(() => ({ busy: false, database: undefined as Database.Database | undefined,
  deliver: vi.fn(), opens: vi.fn() }));
vi.mock("../privacy/platform-erasure-worker-supervisor", () => ({ isErasureWorkerRunning: () => fixture.busy }));
vi.mock("../database/open-platform-database", () => ({ withPlatformDatabase: (_options: unknown, operation: (db: Database.Database) => unknown) => {
  fixture.opens(); return operation(fixture.database!);
} }));
vi.mock("./platform-login-email", () => ({ deliverPlatformLoginMail: fixture.deliver }));
import { enqueueLoginMail, startPlatformLoginMailWorker } from "./platform-login-mail-queue";

afterEach(() => { vi.clearAllTimers(); vi.useRealTimers(); vi.unstubAllEnvs(); fixture.database?.close(); });

it("retains queued mail during erasure, finishes an in-flight receipt, then defers its next claim", async () => {
  vi.useFakeTimers(); const secret = "synthetic-only-".repeat(4);
  vi.stubEnv("TRADERLINK_LOGIN_RATE_LIMIT_SECRET", secret);
  vi.stubEnv("RESEND_API_KEY", "synthetic-no-network");
  vi.stubEnv("TRADERLINK_LOGIN_EMAIL_FROM", "test@example.invalid");
  const db = fixture.database = new Database(":memory:");
  db.exec(`CREATE TABLE platform_login_mail_outbox(delivery_id TEXT PRIMARY KEY,payload_ciphertext TEXT,nonce TEXT,
    authentication_tag TEXT,state TEXT,attempts INTEGER,created_at_utc TEXT,expires_at_utc TEXT,next_attempt_at_utc TEXT)`);
  const mail = { purpose: "reset" as const, email: "test@example.invalid", origin: "https://example.invalid", token: "synthetic-token" };
  enqueueLoginMail(db, mail, secret);
  enqueueLoginMail(db, mail, secret);
  fixture.busy = true;
  startPlatformLoginMailWorker(); await vi.advanceTimersByTimeAsync(10_000);
  expect(fixture.opens).not.toHaveBeenCalled();
  expect(db.prepare("SELECT sum(attempts) attempts FROM platform_login_mail_outbox").get()).toEqual({ attempts: 0 });
  let finish!: () => void;
  fixture.deliver.mockImplementationOnce(() => new Promise<void>(resolve => { finish = resolve; })).mockResolvedValue(undefined);
  fixture.busy = false; await vi.advanceTimersByTimeAsync(5_000);
  expect(fixture.deliver).toHaveBeenCalledOnce();
  fixture.busy = true; finish(); await vi.advanceTimersByTimeAsync(5_000);
  expect(db.prepare("SELECT state,attempts,payload_ciphertext IS NULL scrubbed FROM platform_login_mail_outbox ORDER BY state").all())
    .toEqual([{ state: "pending", attempts: 0, scrubbed: 0 }, { state: "sent", attempts: 1, scrubbed: 1 }]);
  expect(fixture.deliver).toHaveBeenCalledOnce();
  fixture.busy = false; await vi.advanceTimersByTimeAsync(5_000);
  expect(fixture.deliver).toHaveBeenCalledTimes(2);
  expect(db.prepare("SELECT count(*) n FROM platform_login_mail_outbox WHERE state='sent'").get()).toEqual({ n: 2 });
});
