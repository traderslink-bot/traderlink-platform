import { lstatSync, openSync, closeSync, realpathSync } from "node:fs";
import { isAbsolute, resolve, dirname } from "node:path";
import Database from "better-sqlite3";

/** Separate test ledger. Opening it cannot initialize or modify the Platform database. */
export function openPartnerAlertStripeSandboxLedger(directory: string): Database.Database {
  if (!isAbsolute(directory) || realpathSync(directory) !== directory || !/^\/tmp\/traderlink-paid-qa-[a-zA-Z0-9-]+$/u.test(directory)) {
    throw new Error("A disposable Partner Channels sandbox directory is required.");
  }
  const root = lstatSync(directory);
  if (!root.isDirectory() || (root.mode & 0o777) !== 0o700 || root.uid !== process.getuid?.()) {
    throw new Error("A private Stripe ledger directory is required.");
  }
  const path = resolve(directory, "partner-stripe-sandbox.sqlite");
  try { closeSync(openSync(path, "wx", 0o600)); }
  catch (error) {
    if ((error as NodeJS.ErrnoException).code !== "EEXIST") throw error;
  }
  const file = lstatSync(path);
  if (dirname(realpathSync(path)) !== directory || !file.isFile() || file.uid !== root.uid || (file.mode & 0o777) !== 0o600
    || file.nlink !== 1) throw new Error("Unsafe Stripe ledger file.");
  const db = new Database(path, { fileMustExist: true, timeout: 5_000 });
  try {
    db.pragma("foreign_keys = ON");
    db.pragma("journal_mode = WAL");
    db.pragma("synchronous = FULL");
    return db;
  } catch (error) {
    db.close();
    throw error;
  }
}
