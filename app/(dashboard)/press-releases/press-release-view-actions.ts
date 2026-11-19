"use server";

import { revalidatePath } from "next/cache";
import { requireTraderLinkPlatformAuthenticatedPageIdentity } from "@/src/modules/platform/server/authentication/require-platform-request-scope";
import { withPlatformDatabase } from "@/src/modules/platform/server/database/open-platform-database";
import { withReadonlyPlatformDatabase } from "@/src/modules/platform/server/database/open-readonly-platform-database";
import { createCanonicalUtcTimestamp } from "@/src/modules/platform/server/database/platform-migration-contract";
import { assertMembershipNotification } from "@/src/modules/platform/server/membership/membership-notification-access";
import { hasPressReleaseDashboardAccess } from "@/src/modules/news/server/press-release-dashboard-access";
import { PressReleaseSavedViewRepository } from "@/src/modules/news/server/press-release-saved-view-repository";
import type { SaveNewsViewInput } from "@/src/modules/news/contracts/press-release-saved-views";

import { isMembershipAccessDenied } from "@/src/modules/platform/server/membership/platform-membership-access";

function message(error: unknown): string {
  if (isMembershipAccessDenied(error)) return "Your current plan does not include this news option. Review Plans to change access.";
  const text = error instanceof Error ? error.message : "";
  return /^(Enter |You already |You can save |This saved view |Refresh |Minimum |Clear market cap |From date |Check |Choose whether)/u.test(text) ? text : "Your news settings could not be saved. Refresh and try again.";
}
export async function readPressReleaseSavedViews() {
  try { const identity=await requireTraderLinkPlatformAuthenticatedPageIdentity();return {ok:true as const,views:withReadonlyPlatformDatabase({},db=>new PressReleaseSavedViewRepository(db).list(identity.scope.userId))}; }
  catch {return {ok:false as const,message:"Your saved views could not be loaded. Please try again."};}
}
export async function savePressReleaseSavedView(input: SaveNewsViewInput) {
  try {
    const identity=await requireTraderLinkPlatformAuthenticatedPageIdentity();
    if(!hasPressReleaseDashboardAccess(identity))throw Error('Access required');
    const views=withPlatformDatabase({mode:"runtime"},db=>{
      if(input.alertsEnabled)assertMembershipNotification(db,identity.scope.userId,"press_release");
      return new PressReleaseSavedViewRepository(db).save(identity.scope.userId,input,createCanonicalUtcTimestamp());
    });
    revalidatePath("/account/preferences");return {ok:true as const,views};
  }catch(error){return {ok:false as const,message:message(error)};}
}
export async function setPressReleaseViewAlerts(input: {id:string;revision:number;enabled:boolean}) {
  try {
    const identity=await requireTraderLinkPlatformAuthenticatedPageIdentity();
    const views=withPlatformDatabase({mode:"runtime"},db=>{
      if(input.enabled){if(!hasPressReleaseDashboardAccess(identity))throw Error('Access required');assertMembershipNotification(db,identity.scope.userId,"press_release");}
      return new PressReleaseSavedViewRepository(db).setAlerts(identity.scope.userId,input.id,input.revision,input.enabled,createCanonicalUtcTimestamp());
    });
    revalidatePath("/account/preferences");return {ok:true as const,views};
  }catch(error){return {ok:false as const,message:message(error)};}
}
export async function deletePressReleaseSavedView(input: {id:string;revision:number}) {
  try {const identity=await requireTraderLinkPlatformAuthenticatedPageIdentity();const views=withPlatformDatabase({mode:"runtime"},db=>new PressReleaseSavedViewRepository(db).remove(identity.scope.userId,input.id,input.revision));revalidatePath("/account/preferences");return {ok:true as const,views};}
  catch(error){return {ok:false as const,message:message(error)};}
}
export async function retrySavingPressReleasePreference(filters: unknown) {
  try {const identity=await requireTraderLinkPlatformAuthenticatedPageIdentity();if(!hasPressReleaseDashboardAccess(identity))throw Error('Access required');withPlatformDatabase({mode:"runtime"},db=>new PressReleaseSavedViewRepository(db).savePreference(identity.scope.userId,filters,createCanonicalUtcTimestamp()));return {ok:true as const};}
  catch(error){return {ok:false as const,message:message(error)};}
}
