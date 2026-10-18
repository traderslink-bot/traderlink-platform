"use server";

import { revalidatePath } from "next/cache";
import type Database from "better-sqlite3";
import { requireTraderLinkPlatformBillingPageIdentity } from "@/src/modules/platform/server/authentication/require-platform-request-scope";
import { withPlatformDatabase } from "@/src/modules/platform/server/database/open-platform-database";
import { MembershipAddonAmendmentService } from "@/src/modules/platform/server/membership/membership-addon-amendment-service";
import { MembershipAddonAmendmentRepository } from "@/src/modules/platform/server/membership/membership-addon-amendment-repository";
import { membershipAddonAmendmentView } from "@/src/modules/platform/server/membership/membership-addon-amendment-view";
import type { MembershipAddonAmendmentResult } from "@/src/modules/platform/contracts/membership-addon-amendment";
function database<T>(work: (db: Database.Database)=>T): T { return withPlatformDatabase({mode:"runtime"},work); }
function failure(error: unknown): MembershipAddonAmendmentResult {
  const message=error instanceof Error?error.message:"";
  return {ok:false,message:/^(This |Your |Choose |Stripe )/.test(message)?message:"The add-on change could not be completed. Please try again or contact TradersLink."};
}
export async function quoteMembershipAddonAction(requestId: string,subscriptionId: string,addons: readonly string[],invitationSecret?: string): Promise<MembershipAddonAmendmentResult> {
  try { const {scope}=await requireTraderLinkPlatformBillingPageIdentity();
    const row=await new MembershipAddonAmendmentService(database).quote(scope.userId,requestId,subscriptionId,addons,invitationSecret);
    return {ok:true,amendment:membershipAddonAmendmentView(row)};
  }catch(error){return failure(error)}
}
export async function confirmMembershipAddonAction(id: string): Promise<MembershipAddonAmendmentResult> {
  try { const {scope}=await requireTraderLinkPlatformBillingPageIdentity();
    const row=await new MembershipAddonAmendmentService(database).confirm(scope.userId,id);
    revalidatePath("/account/membership");
    return {ok:true,amendment:membershipAddonAmendmentView(row)};
  }catch(error){
    // A lost provider response can follow an accepted charge. Return the durable
    // payment state so the client offers reconciliation rather than another quote.
    try {
      const {scope}=await requireTraderLinkPlatformBillingPageIdentity();
      const row=database(db=>new MembershipAddonAmendmentRepository(db).read(scope.userId,id));
      if (["confirming","pending_payment","reconciliation_required","applied"].includes(row.state)) {
        return {ok:true,amendment:membershipAddonAmendmentView(row)};
      }
    } catch { /* Preserve the original safe error when no owned operation exists. */ }
    return failure(error);
  }
}
export async function refreshMembershipAddonAction(id: string): Promise<MembershipAddonAmendmentResult> {
  try { const {scope}=await requireTraderLinkPlatformBillingPageIdentity();
    const row=await new MembershipAddonAmendmentService(database).refresh(scope.userId,id);
    revalidatePath("/account/membership");
    return {ok:true,amendment:membershipAddonAmendmentView(row)};
  }catch(error){return failure(error)}
}
export async function abandonMembershipAddonQuoteAction(id: string): Promise<MembershipAddonAmendmentResult> {
  try { const {scope}=await requireTraderLinkPlatformBillingPageIdentity();
    const row=database(db=>new MembershipAddonAmendmentRepository(db).abandonQuote(scope.userId,id,new Date().toISOString()));
    return {ok:true,amendment:membershipAddonAmendmentView(row)};
  }catch(error){return failure(error)}
}
