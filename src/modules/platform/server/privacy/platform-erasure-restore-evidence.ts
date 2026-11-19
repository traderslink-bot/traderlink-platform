import { createHash, createPublicKey, verify } from "node:crypto";
import { lstatSync, realpathSync } from "node:fs";
import { dirname, join } from "node:path";
import type Database from "better-sqlite3";
import { PartnerAlertTombstoneLedger } from "../../../partner-alerts/server/partner-alert-tombstone-ledger";
import { matchesPartnerAlertTombstoneSubject } from "../../../partner-alerts/server/partner-alert-restore-tombstones";

type LedgerPin = Readonly<{generation:number;sha256:string}>;
type Key = Parameters<typeof matchesPartnerAlertTombstoneSubject>[2];
const held = (): never => { throw new Error("platform_restore_evidence_held"); };

/** Stage the original committed tombstone for the canonical participant.
 * The caller must own an admitted restore transaction in a quarantined image.
 * This helper neither creates the Core operation nor grants root authority. */
export function stageCommittedRestoreTombstone(database: Database.Database,
  ledger: PartnerAlertTombstoneLedger, pin: LedgerPin, operationRef: string, userId: string,
  key: Key, atUtc: string,
): void {
  if (!database.inTransaction || !(ledger instanceof PartnerAlertTombstoneLedger)
    || !Number.isFinite(Date.parse(atUtc)) || new Date(atUtc).toISOString() !== atUtc) return held();
  const view = PartnerAlertTombstoneLedger.prototype.read.call(ledger);
  if (view.generation !== pin.generation || view.sha256 !== pin.sha256 || view.unresolvedPrepared.length) return held();
  const matches = view.committed.filter(row => row.sourceOperationRef === operationRef);
  const tombstone = matches[0];
  if (matches.length !== 1 || !tombstone || tombstone.erasedAtUtc > atUtc || tombstone.retainUntilUtc <= atUtc
    || !matchesPartnerAlertTombstoneSubject(tombstone,userId,key)) return held();
  const operation = database.prepare(`SELECT o.lifecycle_ref FROM platform_erasure_module_operations o
    JOIN platform_erasure_lifecycles l ON l.lifecycle_ref=o.lifecycle_ref AND l.operation_ref=o.operation_ref
    JOIN platform_users u ON u.user_id=l.user_id WHERE o.operation_ref=? AND l.user_id=?
    AND o.phase IN ('prepared','settling','ready') AND l.phase IN ('preparing','settling')`)
    .get(operationRef,userId) as {lifecycle_ref:string}|undefined;
  if (operation?.lifecycle_ref !== tombstone.lifecycleRef) return held();
  const json = JSON.stringify(tombstone);
  const hash = createHash("sha256").update(json).digest("hex");
  database.prepare(`INSERT INTO platform_erasure_operation_claims
    (operation_ref,participant,claim_ref,original_json,original_sha256,state,outcome_ref)
    VALUES(?,'partner_tombstone','restore_tombstone',?,?,'captured',NULL)
    ON CONFLICT(operation_ref,participant,claim_ref) DO NOTHING`).run(operationRef,json,hash);
  const claim = database.prepare(`SELECT original_json,original_sha256,state,outcome_ref
    FROM platform_erasure_operation_claims WHERE operation_ref=? AND participant='partner_tombstone'
    AND claim_ref='restore_tombstone'`).get(operationRef) as
    {original_json:string;original_sha256:string;state:string;outcome_ref:string|null}|undefined;
  if (!claim || claim.original_json !== json || claim.original_sha256 !== hash
    || claim.state !== "captured" || claim.outcome_ref !== null) return held();
  const current = PartnerAlertTombstoneLedger.prototype.read.call(ledger);
  if (current.generation !== pin.generation || current.sha256 !== pin.sha256) return held();
}

/** Independently pinned closure evidence for this exact image and tombstone.
 * Missing inventory is a hold. A zero-file list is valid only if the external
 * producer proved that the original closure contained no private files. */
export function verifyAbsentRestoreClosure(database: Database.Database, input: Readonly<{
  snapshotSha256: string; ledgerSha256: string; tombstoneRef: string; expectedInventorySha256: string;
  inventory: Readonly<{snapshotSha256:string;ledgerSha256:string;tombstoneRef:string;
    roots:readonly {table:string;column:string;value:string}[];
    absentFiles:readonly string[]}>;
  quarantineVault: string;
}>): void {
  const {inventory} = input;
  if (!database.inTransaction || !/^[0-9a-f]{64}$/u.test(input.expectedInventorySha256)
    || inventory.snapshotSha256 !== input.snapshotSha256 || inventory.ledgerSha256 !== input.ledgerSha256
    || inventory.tombstoneRef !== input.tombstoneRef
    || inventory.roots.length < 1 || inventory.roots.length > 10_000 || inventory.absentFiles.length > 10_000
    || createHash("sha256").update(JSON.stringify(inventory)).digest("hex") !== input.expectedInventorySha256) return held();
  const identifier = (value:string) => {
    if (!/^[a-z_][a-z0-9_]*$/u.test(value)) return held();
    return `"${value}"`;
  };
  for (const root of inventory.roots) {
    // Do not use a quoted unknown column: SQLite can interpret it as a string.
    const columns = database.prepare("SELECT name FROM pragma_table_info(?, 'main')").all(root.table) as {name:string}[];
    if (!columns.some(column=>column.name===root.column)
      || database.prepare(`SELECT 1 FROM main.${identifier(root.table)} WHERE ${identifier(root.column)}=? LIMIT 1`).get(root.value)) return held();
  }
  if (database.prepare("PRAGMA foreign_key_check").get()) return held();
  const vault = realpathSync(input.quarantineVault);
  if (vault !== input.quarantineVault || !lstatSync(vault).isDirectory()) return held();
  for (const relative of inventory.absentFiles) {
    if (!/^(?:(?:ibkr|mapped_csv)\/[0-9a-f]{64}\.csv|[A-Za-z0-9_-]{32,160})$/u.test(relative)) return held();
    const parent = dirname(join(vault,relative));
    if (realpathSync(parent) !== parent) return held();
    try { lstatSync(join(vault,relative)); }
    catch (error) {
      if (error && typeof error === "object" && "code" in error && error.code === "ENOENT") continue;
      throw error;
    }
    return held();
  }
}

/** Independent archival attestation. The trusted public key comes from the
 * restore controller, never from the snapshot, inventory or signer envelope. */
export function verifyAttestedAbsentRestoreClosure(database: Database.Database,
  input: Parameters<typeof verifyAbsentRestoreClosure>[1],
  signature: string, archivalPublicKeyPem: string,
): void {
  if (!/^[A-Za-z0-9_-]{86}$/u.test(signature) || Buffer.byteLength(archivalPublicKeyPem) > 4096) return held();
  try {
    const key = createPublicKey(archivalPublicKeyPem);
    const attestation = JSON.stringify(["platform-restore-absent-closure-v1",input.snapshotSha256,
      input.ledgerSha256,input.tombstoneRef,input.expectedInventorySha256]);
    if (key.asymmetricKeyType !== "ed25519"
      || !verify(null,Buffer.from(attestation),key,Buffer.from(signature,"base64url"))) return held();
  } catch { return held(); }
  verifyAbsentRestoreClosure(database,input);
}

/** Archive-side evidence producer for a specific pre-deletion closure plan.
 * The archive service must supply a complete canonical plan, not a list
 * reconstructed from the restore candidate. This verifies each planned row
 * and file existed before allowing the separate archive signer to attest it. */
export function captureRestoreInventoryFromOriginal(database: Database.Database,
  input: Parameters<typeof verifyAbsentRestoreClosure>[1]["inventory"],
  originalVault: string,
) {
  if (!database.inTransaction || input.roots.length < 1 || input.roots.length > 10_000
    || input.absentFiles.length > 10_000 || realpathSync(originalVault) !== originalVault) return held();
  for (const {table,column,value} of input.roots) {
    if (!/^[a-z_][a-z0-9_]*$/u.test(table) || !/^[a-z_][a-z0-9_]*$/u.test(column)) return held();
    const columns = database.prepare("SELECT name FROM pragma_table_info(?, 'main')").all(table) as {name:string}[];
    if (!columns.some(item=>item.name===column)
      || !database.prepare(`SELECT 1 FROM main."${table}" WHERE "${column}"=? LIMIT 1`).get(value)) return held();
  }
  for (const relative of input.absentFiles) {
    if (!/^(?:(?:ibkr|mapped_csv)\/[0-9a-f]{64}\.csv|[A-Za-z0-9_-]{32,160})$/u.test(relative)) return held();
    const path=join(originalVault,relative);
    if (realpathSync(path) !== path || !lstatSync(path).isFile()) return held();
  }
  const inventory = Object.freeze({snapshotSha256:input.snapshotSha256,ledgerSha256:input.ledgerSha256,
    tombstoneRef:input.tombstoneRef,roots:Object.freeze(input.roots.map(root=>Object.freeze({...root}))),
    absentFiles:Object.freeze([...input.absentFiles])});
  return Object.freeze({inventory,inventorySha256:createHash("sha256").update(JSON.stringify(inventory)).digest("hex")});
}
