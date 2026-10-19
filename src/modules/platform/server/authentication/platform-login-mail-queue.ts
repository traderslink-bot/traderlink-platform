import "server-only";
import {
  createCipheriv,
  createDecipheriv,
  hkdfSync,
  randomBytes,
  randomUUID,
} from "node:crypto";
import type Database from "better-sqlite3";
import { withPlatformDatabase } from "../database/open-platform-database";
import {
  deliverPlatformLoginMail,
  type LoginMail,
} from "./platform-login-email";
function key(secret: string) {
  if (secret.length < 32) throw new Error("Login mail is not configured.");
  return Buffer.from(
    hkdfSync(
      "sha256",
      Buffer.from(secret),
      Buffer.alloc(0),
      Buffer.from("traderslink-login-mail-v1"),
      32,
    ),
  );
}
export function enqueueLoginMail(
  db: Database.Database,
  mail: LoginMail,
  secret: string,
  now = new Date(),
) {
  const id = randomUUID(),
    nonce = randomBytes(12);
  const cipher = createCipheriv("aes-256-gcm", key(secret), nonce);
  cipher.setAAD(Buffer.from(id));
  const payload = Buffer.concat([
    cipher.update(JSON.stringify({ ...mail, deliveryId: id }), "utf8"),
    cipher.final(),
  ]);
  db.prepare(
    "INSERT INTO platform_login_mail_outbox VALUES (?,?,?,?, 'pending',0,?,?,?)",
  ).run(
    id,
    payload.toString("base64"),
    nonce.toString("base64"),
    cipher.getAuthTag().toString("base64"),
    now.toISOString(),
    new Date(
      now.getTime() +
        (mail.purpose === "reset" || mail.purpose === "change-email"
          ? 1800000
          : 86400000),
    ).toISOString(),
    now.toISOString(),
  );
  return id;
}
type Row = {
  delivery_id: string;
  payload_ciphertext: string | null;
  nonce: string;
  authentication_tag: string;
  attempts: number;
};
export function claimLoginMail(
  db: Database.Database,
  secret: string,
  now = new Date(),
): { id: string; mail: LoginMail } | null {
  return db
    .transaction(() => {
      const at = now.toISOString();
      db.prepare(
        "UPDATE platform_login_mail_outbox SET state='expired',payload_ciphertext=NULL WHERE state='pending' AND expires_at_utc<=?",
      ).run(at);
      const row = db
        .prepare(
          "SELECT * FROM platform_login_mail_outbox WHERE state='pending' AND attempts<5 AND next_attempt_at_utc<=? ORDER BY created_at_utc LIMIT 1",
        )
        .get(at) as Row | undefined;
      if (!row) return null;
      db.prepare(
        "UPDATE platform_login_mail_outbox SET attempts=attempts+1,next_attempt_at_utc=? WHERE delivery_id=?",
      ).run(new Date(now.getTime() + 30000).toISOString(), row.delivery_id);
      const decipher = createDecipheriv(
        "aes-256-gcm",
        key(secret),
        Buffer.from(row.nonce, "base64"),
      );
      decipher.setAAD(Buffer.from(row.delivery_id));
      decipher.setAuthTag(Buffer.from(row.authentication_tag, "base64"));
      try {
        const json = Buffer.concat([
          decipher.update(Buffer.from(row.payload_ciphertext!, "base64")),
          decipher.final(),
        ]).toString("utf8");
        return { id: row.delivery_id, mail: JSON.parse(json) as LoginMail };
      } catch {
        db.prepare(
          "UPDATE platform_login_mail_outbox SET state='failed',payload_ciphertext=NULL WHERE delivery_id=?",
        ).run(row.delivery_id);
        return null;
      }
    })
    .immediate();
}
export function finishLoginMail(
  db: Database.Database,
  id: string,
  sent: boolean,
) {
  db.prepare(
    "UPDATE platform_login_mail_outbox SET state=CASE WHEN ?=1 THEN 'sent' WHEN attempts>=5 THEN 'failed' ELSE 'pending' END,payload_ciphertext=CASE WHEN ?=1 OR attempts>=5 THEN NULL ELSE payload_ciphertext END WHERE delivery_id=?",
  ).run(sent ? 1 : 0, sent ? 1 : 0, id);
}
let started = false,
  running = false;
export function startPlatformLoginMailWorker() {
  if (
    started ||
    (process.env.TRADERLINK_LOGIN_RATE_LIMIT_SECRET?.length ?? 0) < 32 ||
    !process.env.RESEND_API_KEY ||
    !process.env.TRADERLINK_LOGIN_EMAIL_FROM
  )
    return;
  started = true;
  const run = async () => {
    if (running) return;
    running = true;
    try {
      for (let i = 0; i < 3; i++) {
        const job = withPlatformDatabase({ mode: "runtime" }, (db) =>
          claimLoginMail(db, process.env.TRADERLINK_LOGIN_RATE_LIMIT_SECRET!),
        );
        if (!job) break;
        let sent = false;
        try {
          await deliverPlatformLoginMail(job.mail);
          sent = true;
        } catch {
          /* Retain bounded encrypted retry; never log recipients or token-bearing payloads. */
        }
        withPlatformDatabase({ mode: "runtime" }, (db) =>
          finishLoginMail(db, job.id, sent),
        );
      }
    } catch {
      console.error("Login email queue is temporarily unavailable.");
    } finally {
      running = false;
    }
  };
  const timer = setInterval(() => void run(), 5000);
  timer.unref();
  void run();
}
