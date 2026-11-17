import type Database from "better-sqlite3";
import type { PartnerAlertAccessTicket } from "../contracts/partner-alert-contracts";
import { createPartnerAlertWhopReceiptReader, type PartnerAlertWhopReceiptInputs } from "./partner-alert-whop-evidence-reader";

type WhopAccess = "active" | "absent" | "unknown";

/** Protects legacy Whop access using the same current, scoped receipts as
 * Partner Channels. A missing, expired or incomplete receipt cannot show loss. */
export function createPartnerAlertStripeWhopAccess(input: Readonly<{
  readCurrentTicket: (subject: { userId: string; communityId: string; mappingId: string }) => PartnerAlertAccessTicket | null;
  db: Database.Database;
  receipt: PartnerAlertWhopReceiptInputs;
  inCurrentWriter: <T>(operation: () => T) => T;
  nowUtc: () => string;
}>) {
  const readReceipt = createPartnerAlertWhopReceiptReader(input.db, { ...input.receipt, includeWithdrawnOffers: true });
  return (userId: string, communityId: string, mappingId: string): WhopAccess => {
    try {
      return input.inCurrentWriter(() => {
        const ticket = input.readCurrentTicket({ userId, communityId, mappingId });
        const now = input.nowUtc();
        if (!ticket || ticket.context.userId !== userId || ticket.context.communityId !== communityId
          || ticket.context.mappingId !== mappingId || ticket.context.observedAtUtc > now
          || ticket.context.validUntilUtc <= now) return "unknown";
        const receipt = readReceipt(ticket);
        if (!receipt || receipt.membershipDiscovery !== "complete" || receipt.communityCoverageQualification.kind !== "qualified") {
          return "unknown";
        }
        let unknown = false;
        for (const membership of receipt.memberships) {
          if (membership.userId !== userId || membership.communityId !== communityId || membership.observedAtUtc > now
            || membership.validUntilUtc <= now) { unknown = true; continue; }
          if (membership.state === "inactive") continue;
          const coverage = membership.paidCoverage;
          if (membership.state === "active" && membership.basis === "paid" && coverage
            && coverage.startsAtUtc <= now && coverage.endsAtUtc > now) return "active";
          // A current access grant or unresolved provider status can still
          // protect a legacy role even without current-period payment proof.
          unknown = true;
        }
        return unknown ? "unknown" : "absent";
      });
    } catch { return "unknown"; }
  };
}
