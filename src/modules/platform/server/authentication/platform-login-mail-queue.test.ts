// @vitest-environment node
import Database from "better-sqlite3";
import { describe, expect, it, vi } from "vitest";
vi.mock("server-only", () => ({}));
import {
  enqueueLoginMail,
  claimLoginMail,
  finishLoginMail,
} from "./platform-login-mail-queue";
import { platformLoginSchemaStatements } from "./platform-login-schema";
function fixture() {
  const db = new Database(":memory:");
  db.exec(
    platformLoginSchemaStatements.find((s) =>
      s.includes("CREATE TABLE platform_login_mail_outbox"),
    )!,
  );
  return db;
}
const secret = "synthetic-independent-login-secret-32-characters";
describe("durable encrypted authentication mail", () => {
  it("encrypts tokens and addresses, leases atomically, retries and clears sent payloads", () => {
    const db = fixture();
    try {
      const now = new Date("2026-10-14T00:00:00.000Z");
      const mail = {
        email: "member@example.test",
        purpose: "verify" as const,
        token: "synthetic-private-token",
        origin: "https://app.example.test",
      };
      const id = enqueueLoginMail(db, mail, secret, now);
      const raw = JSON.stringify(
        db.prepare("SELECT * FROM platform_login_mail_outbox").get(),
      );
      expect(raw).not.toContain(mail.email);
      expect(raw).not.toContain(mail.token);
      const job = claimLoginMail(db, secret, now)!;
      expect(job.mail).toMatchObject(mail);
      expect(claimLoginMail(db, secret, now)).toBeNull();
      finishLoginMail(db, id, false);
      expect(
        claimLoginMail(db, secret, new Date(now.getTime() + 31000))?.id,
      ).toBe(id);
      finishLoginMail(db, id, true);
      expect(
        db
          .prepare(
            "SELECT state,payload_ciphertext FROM platform_login_mail_outbox",
          )
          .get(),
      ).toEqual({ state: "sent", payload_ciphertext: null });
    } finally {
      db.close();
    }
  });
  it("expires unsent messages without delivery", () => {
    const db = fixture();
    try {
      const now = new Date("2026-10-14T00:00:00.000Z");
      enqueueLoginMail(
        db,
        {
          email: "member@example.test",
          purpose: "reset",
          token: "synthetic-token",
          origin: "https://app.example.test",
        },
        secret,
        now,
      );
      expect(
        claimLoginMail(db, secret, new Date(now.getTime() + 1800001)),
      ).toBeNull();
      expect(
        db
          .prepare(
            "SELECT state,payload_ciphertext FROM platform_login_mail_outbox",
          )
          .get(),
      ).toEqual({ state: "expired", payload_ciphertext: null });
    } finally {
      db.close();
    }
  });
  it("rejects ciphertext copied to another delivery identity", () => {
    const db = fixture();
    try {
      const now = new Date("2026-10-14T00:00:00.000Z");
      const id = enqueueLoginMail(db, {
        email: "member@example.test",
        purpose: "reset",
        token: "synthetic-token",
        origin: "https://app.example.test",
      }, secret, now);
      const replacement = "00000000-0000-4000-8000-000000000001";
      db.prepare("UPDATE platform_login_mail_outbox SET delivery_id=? WHERE delivery_id=?")
        .run(replacement, id);
      expect(claimLoginMail(db, secret, now)).toBeNull();
      expect(db.prepare("SELECT state,payload_ciphertext FROM platform_login_mail_outbox").get())
        .toEqual({ state: "failed", payload_ciphertext: null });
    } finally {
      db.close();
    }
  });
});
