import type Database from "better-sqlite3";
import { partnerAlertId, partnerAlertRef } from "../contracts/partner-alert-validation";
import { erasureHold } from "../../platform/server/privacy/platform-erasure-admission";
import { qualifyPartnerAlertRestore } from "./partner-alert-restore-tombstones";
import type { PartnerAlertTombstoneLedgerView } from "./partner-alert-tombstone-ledger";

type Key = Readonly<{ keyRef: string; key: Uint8Array }>;
type Ledger = Readonly<{ read: () => PartnerAlertTombstoneLedgerView }>;

/** Pre-traffic recovery consumer. Positive reapplication remains unavailable
 * until Platform Core supplies and verifies canonical root-erasure proof.
 * A callback, missing user row, or structurally shaped receipt is never proof. */
export class PartnerAlertRestoreReapplication {
  constructor(private readonly database: Database.Database, private readonly ledger: Ledger,
    private readonly input: Readonly<{ keys: readonly Key[]; bindingKeyringSha256: string;
      nowUtc: () => string;
    }>) {
    if (!input.keys.length || input.keys.length > 32 || !/^[0-9a-f]{64}$/u.test(input.bindingKeyringSha256)
      || typeof input.nowUtc !== "function") return erasureHold();
    if (new Set(input.keys.map(key => partnerAlertRef(key.keyRef,"bindingKeyRef"))).size !== input.keys.length) return erasureHold();
  }

  reapply(restoredDatabaseSha256: string): Readonly<{ restoreRef: string; checkedTombstones: number; deletedPrincipals: number }> {
    if (this.database.inTransaction || !/^[0-9a-f]{64}$/u.test(restoredDatabaseSha256)) return erasureHold();
    const current = this.ledger.read();
    if (current.unresolvedPrepared.length) return erasureHold();
    qualifyPartnerAlertRestore({ atUtc:this.input.nowUtc(),ledgerGeneration:current.generation,
      ledgerSha256:current.sha256,bindingKeyringSha256:this.input.bindingKeyringSha256,
      availableKeyRefs:this.input.keys.map(key=>key.keyRef),tombstones:current.committed });
    return erasureHold();
  }

  assertVerifiedCurrent(restoreRef: string): void {
    partnerAlertId(restoreRef,"restoreRef");
    return erasureHold();
  }
}
