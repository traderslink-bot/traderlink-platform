import Database from "better-sqlite3";
import { assertPartnerAlertWhopEvidenceAbsent } from "../../../partner-alerts/server/partner-alert-whop-evidence-retention";
import { createHash, createPublicKey, verify } from "node:crypto";
import { closeSync, constants, fstatSync, lstatSync, openSync, readSync, realpathSync } from "node:fs";

const held = (): never => { throw new Error("platform_restore_startup_held"); };
const MAX_RESTORE_IMAGE_BYTES = 64 * 1024 * 1024;
const hex = (v: unknown): v is string => typeof v === "string" && /^[a-f0-9]{64}$/u.test(v);

type StartupProof = Readonly<{ version: 1; databaseSha256: string; ledgerSha256: string;
  keyringSha256: string; inventorySha256: string; expiresAtUtc: string }>;

/** A detached receipt signed outside the app and restored image. The verifier
 * never generates a receipt or accepts a key embedded in one. */
export function readVerifiedPlatformRestoreImage(input: Readonly<{
  databasePath: string; expectedLedgerSha256: string; expectedKeyringSha256: string;
  expectedInventorySha256: string; signedPayload: string; signature: string; publicKeyPem: string; nowUtc: string;
}>): Buffer {
  if (Buffer.byteLength(input.signedPayload) > 4096 || !/^[A-Za-z0-9_-]{86}$/u.test(input.signature)
    || Buffer.byteLength(input.publicKeyPem) > 4096) return held();
  try {
    const key = createPublicKey(input.publicKeyPem);
    if (key.asymmetricKeyType !== "ed25519" || !verify(null,Buffer.from(input.signedPayload),key,
      Buffer.from(input.signature,"base64url"))) return held();
    const receipt = JSON.parse(input.signedPayload) as StartupProof;
    const now = Date.parse(input.nowUtc), expiry = Date.parse(receipt.expiresAtUtc);
    if (receipt.version !== 1 || !hex(receipt.databaseSha256)
      || !hex(receipt.ledgerSha256) || receipt.ledgerSha256 !== input.expectedLedgerSha256
      || !hex(receipt.keyringSha256) || receipt.keyringSha256 !== input.expectedKeyringSha256
      || !hex(receipt.inventorySha256) || receipt.inventorySha256 !== input.expectedInventorySha256
      || !Number.isFinite(now) || !Number.isFinite(expiry) || expiry <= now) return held();
    const path = input.databasePath;
    const clean = () => ["-wal","-shm","-journal"].every(suffix => {
      try { lstatSync(path+suffix); return false; }
      catch (error) { if ((error as NodeJS.ErrnoException).code === "ENOENT") return true; throw error; }
    });
    if (realpathSync(path) !== path || !clean()) return held();
    const fd = openSync(path,constants.O_RDONLY|constants.O_NOFOLLOW|constants.O_NONBLOCK);
    try {
      const before = fstatSync(fd);
      if (!before.isFile() || before.nlink !== 1 || before.size < 1 || before.size > MAX_RESTORE_IMAGE_BYTES) return held();
      const digest = createHash("sha256"), buffer = Buffer.alloc(before.size);
      let read = 0;
      while (read < before.size) {
        const count = readSync(fd,buffer,read,Math.min(1024*1024,before.size-read),read);
        if (!count) return held();
        digest.update(buffer.subarray(read,read+count)); read += count;
      }
      const after = fstatSync(fd), named = lstatSync(path);
      if (after.size !== before.size || after.mtimeMs !== before.mtimeMs || after.ctimeMs !== before.ctimeMs
        || named.dev !== before.dev || named.ino !== before.ino || !clean()
        || digest.digest("hex") !== receipt.databaseSha256) return held();
      return buffer;
    } finally { closeSync(fd); }
  } catch { return held(); }
}

export function verifyPlatformRestoreStartupProof(input: Parameters<typeof readVerifiedPlatformRestoreImage>[0]): void {
  openVerifiedPlatformRestoreImage(input).close();
}

/** Opens the exact signed bytes, never a second read of the candidate path.
 * This isolated reader is for restore proof only, not the persistent app. */
export function openVerifiedPlatformRestoreImage(input: Parameters<typeof readVerifiedPlatformRestoreImage>[0]) {
  const database = new Database(readVerifiedPlatformRestoreImage(input),{readonly:true});
  try {
    database.pragma("query_only = ON");
    if (database.pragma("quick_check(1)",{simple:true}) !== "ok" || database.prepare("PRAGMA foreign_key_check").get()) return held();
    assertPartnerAlertWhopEvidenceAbsent(database);
    return database;
  } catch { database.close(); return held(); }
}

export function assertPlatformRestoreStartup(databasePath: string, environment: NodeJS.ProcessEnv): void {
  const selection = environment.TRADERLINK_PLATFORM_RESTORE_STARTUP;
  const keys = ["PAYLOAD","SIGNATURE","PUBLIC_KEY","LEDGER_SHA256","KEYRING_SHA256","INVENTORY_SHA256"] as const;
  const values = keys.map(key=>environment[`TRADERLINK_PLATFORM_RESTORE_${key}`]);
  if (selection === undefined && values.every(value=>value === undefined)) return;
  if (selection !== "required" || values.some(value=>!value)) return held();
  const [signedPayload,signature,publicKeyPem,expectedLedgerSha256,expectedKeyringSha256,expectedInventorySha256] = values as string[];
  verifyPlatformRestoreStartupProof({databasePath,signedPayload: signedPayload!,signature:signature!,publicKeyPem:publicKeyPem!,
    expectedLedgerSha256:expectedLedgerSha256!,expectedKeyringSha256:expectedKeyringSha256!,
    expectedInventorySha256:expectedInventorySha256!,nowUtc:new Date().toISOString()});
}
