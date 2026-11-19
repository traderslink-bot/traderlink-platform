import { createCipheriv, createDecipheriv, createHash, randomBytes, randomUUID } from "node:crypto";
import { closeSync, constants, existsSync, fsyncSync, openSync, renameSync,
  realpathSync, unlinkSync, writeFileSync } from "node:fs";
import { basename, dirname, isAbsolute, join } from "node:path";
import { partnerAlertInteger, partnerAlertRef } from "../contracts/partner-alert-validation";
import { validatePartnerAlertErasureTombstone, type PartnerAlertErasureTombstone } from "./partner-alert-restore-tombstones";
import { readPartnerAlertTombstoneLedgerBytes } from "./partner-alert-tombstone-ledger-bounded-reader";

type State = "prepared" | "committed" | "aborted";
type Record = Readonly<{ tombstone: PartnerAlertErasureTombstone; state: State }>;
type Snapshot = Readonly<{ version: 1 | 2; ledgerId: string; generation: number; previousSha256: string;
  records: readonly Record[] }>;
type Envelope = Readonly<{ version: 1 | 2; keyRef: string; iv: string; tag: string; ciphertext: string }>;

export type PartnerAlertTombstoneLedgerReceipt = Readonly<{ generation: number; sha256: string }>;
export type PartnerAlertTombstoneLedgerView = PartnerAlertTombstoneLedgerReceipt & Readonly<{
  committed: readonly PartnerAlertErasureTombstone[];
  unresolvedPrepared: readonly PartnerAlertErasureTombstone[];
}>;

function sha(value: string): string { return createHash("sha256").update(value).digest("hex"); }
function canonical(snapshot: Snapshot): string { return JSON.stringify(snapshot); }

/** Separate encrypted rolling-restore ledger. No instance starts timers or
 * opens a file until an explicit read/write method is called. */
export class PartnerAlertTombstoneLedger {
  private readonly path: string;
  private readonly root: string;
  private readonly ledgerId: string;
  private readonly keyRef: string;
  private readonly key: Uint8Array;

  constructor(input: Readonly<{ path: string; root: string; ledgerId: string; keyRef: string; key: Uint8Array }>) {
    if (!isAbsolute(input.path) || !isAbsolute(input.root) || dirname(input.path) !== input.root
      || basename(input.path).startsWith(".") || basename(input.path).length > 120) {
      throw new Error("partner_alert_tombstone_ledger_path");
    }
    this.root = realpathSync(input.root);
    if (realpathSync(dirname(input.path)) !== this.root) throw new Error("partner_alert_tombstone_ledger_root");
    this.path = join(this.root, basename(input.path));
    this.ledgerId = partnerAlertRef(input.ledgerId,"ledgerId");
    this.keyRef = partnerAlertRef(input.keyRef,"ledgerKeyRef");
    if (!(input.key instanceof Uint8Array) || input.key.byteLength !== 32) throw new Error("partner_alert_tombstone_ledger_key");
    this.key = input.key;
  }

  private aad(version: 1 | 2): Buffer { return Buffer.from(`partner-alert-tombstone-ledger-v${version}\u0000${this.ledgerId}`); }

  private decode(): Snapshot {
    if (!existsSync(this.path)) return Object.freeze({ version: 1, ledgerId: this.ledgerId,
      generation: 0, previousSha256: "0".repeat(64), records: Object.freeze([]) });
    const bytes = readPartnerAlertTombstoneLedgerBytes(this.path,this.root,16 * 1024 * 1024);
    const envelope = JSON.parse(bytes.toString("utf8")) as Envelope;
    if (![1,2].includes(envelope.version) || envelope.keyRef !== this.keyRef) throw new Error("partner_alert_tombstone_ledger_envelope");
    const decipher = createDecipheriv("aes-256-gcm", this.key, Buffer.from(envelope.iv,"base64url"));
    decipher.setAAD(this.aad(envelope.version)); decipher.setAuthTag(Buffer.from(envelope.tag,"base64url"));
    const plaintext = Buffer.concat([decipher.update(Buffer.from(envelope.ciphertext,"base64url")),decipher.final()]);
    const snapshot = JSON.parse(plaintext.toString("utf8")) as Snapshot;
    if (snapshot.version !== envelope.version || snapshot.ledgerId !== this.ledgerId || !Number.isSafeInteger(snapshot.generation)
      || snapshot.generation < 0 || !/^[0-9a-f]{64}$/u.test(snapshot.previousSha256)
      || !Array.isArray(snapshot.records) || snapshot.records.length > 100_000) {
      throw new Error("partner_alert_tombstone_ledger_snapshot");
    }
    for (const row of snapshot.records) {
      if (!["prepared","committed","aborted"].includes(row.state)
        || snapshot.version === 1 && row.tombstone.version === 2) throw Error("partner_alert_tombstone_ledger_version");
      validatePartnerAlertErasureTombstone(row.tombstone);
    }
    return Object.freeze({ ...snapshot, records: Object.freeze(snapshot.records) });
  }

  private write(previous: Snapshot, records: readonly Record[]): PartnerAlertTombstoneLedgerReceipt {
    const prior = canonical(previous);
    for (const row of records) validatePartnerAlertErasureTombstone(row.tombstone);
    const version = previous.version === 2 || records.some(row => row.tombstone.version === 2) ? 2 : 1;
    const next: Snapshot = Object.freeze({ version, ledgerId: this.ledgerId,
      generation: previous.generation + 1, previousSha256: sha(prior), records: Object.freeze(records) });
    const plaintext = canonical(next); const iv = randomBytes(12);
    const cipher = createCipheriv("aes-256-gcm", this.key, iv); cipher.setAAD(this.aad(version));
    const ciphertext = Buffer.concat([cipher.update(plaintext,"utf8"),cipher.final()]);
    const envelope: Envelope = Object.freeze({ version, keyRef: this.keyRef, iv: iv.toString("base64url"),
      tag: cipher.getAuthTag().toString("base64url"), ciphertext: ciphertext.toString("base64url") });
    const temporary = join(this.root, `.${basename(this.path)}.${process.pid}.${randomUUID()}.tmp`);
    let descriptor: number | null = null;
    try {
      descriptor = openSync(temporary, constants.O_CREAT|constants.O_EXCL|constants.O_WRONLY|constants.O_NOFOLLOW,0o600);
      writeFileSync(descriptor,JSON.stringify(envelope)); fsyncSync(descriptor); closeSync(descriptor); descriptor = null;
      renameSync(temporary,this.path);
      const directory = openSync(this.root,constants.O_RDONLY); try { fsyncSync(directory); } finally { closeSync(directory); }
    } finally {
      if (descriptor !== null) closeSync(descriptor);
      if (existsSync(temporary)) unlinkSync(temporary);
    }
    return Object.freeze({ generation: next.generation, sha256: sha(plaintext) });
  }

  read(): PartnerAlertTombstoneLedgerView {
    const snapshot = this.decode(); const body = canonical(snapshot);
    return Object.freeze({ generation: snapshot.generation, sha256: sha(body),
      committed: Object.freeze(snapshot.records.filter(row => row.state === "committed").map(row => row.tombstone)),
      unresolvedPrepared: Object.freeze(snapshot.records.filter(row => row.state === "prepared").map(row => row.tombstone)) });
  }

  prepare(tombstone: PartnerAlertErasureTombstone, expected: PartnerAlertTombstoneLedgerReceipt): PartnerAlertTombstoneLedgerReceipt {
    const snapshot = this.decode(); this.assertExpected(snapshot,expected);
    if (snapshot.records.some(row => row.tombstone.tombstoneRef === tombstone.tombstoneRef
      || row.tombstone.lifecycleRef === tombstone.lifecycleRef || row.tombstone.sourceOperationRef === tombstone.sourceOperationRef)) {
      throw new Error("partner_alert_tombstone_ledger_conflict");
    }
    return this.write(snapshot,[...snapshot.records,Object.freeze({ tombstone,state:"prepared" as const })]);
  }

  transition(tombstoneRef: string, state: "committed" | "aborted",
    expected: PartnerAlertTombstoneLedgerReceipt): PartnerAlertTombstoneLedgerReceipt {
    const snapshot = this.decode(); this.assertExpected(snapshot,expected);
    let found = false;
    const records = snapshot.records.map(row => {
      if (row.tombstone.tombstoneRef !== tombstoneRef) return row;
      if (row.state !== "prepared") throw new Error("partner_alert_tombstone_ledger_transition");
      found = true; return Object.freeze({ tombstone: row.tombstone,state });
    });
    if (!found) throw new Error("partner_alert_tombstone_ledger_missing");
    return this.write(snapshot,records);
  }

  private assertExpected(snapshot: Snapshot, expected: PartnerAlertTombstoneLedgerReceipt): void {
    partnerAlertInteger(expected.generation,"expectedLedgerGeneration",0);
    if (!/^[0-9a-f]{64}$/u.test(expected.sha256) || expected.generation !== snapshot.generation
      || expected.sha256 !== sha(canonical(snapshot))) throw new Error("partner_alert_tombstone_ledger_changed");
  }
}
