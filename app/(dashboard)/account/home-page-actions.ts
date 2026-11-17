"use server";

import { revalidatePath } from "next/cache";
import { headers } from "next/headers";

import { isPlatformHomePage, type PlatformHomePage } from "@/src/modules/platform/contracts/platform-home-page";
import { requireTraderLinkPlatformAuthenticatedRequestIdentity } from "@/src/modules/platform/server/authentication/require-platform-request-scope";
import { withPlatformDatabase } from "@/src/modules/platform/server/database/open-platform-database";
import { createCanonicalUtcTimestamp } from "@/src/modules/platform/server/database/platform-migration-contract";
import { readPlatformHomeAccess } from "@/src/modules/platform/server/identity/platform-home-page-access";
import { PlatformUserPreferenceRepository } from "@/src/modules/platform/server/identity/platform-user-preference-repository";

export async function saveHomePage(value: unknown): Promise<
  { ok: true; homePage: PlatformHomePage } | { ok: false; message: string }
> {
  if (!isPlatformHomePage(value)) return { ok: false, message: "Choose a home page from the list." };

  try {
    const requestHeaders = await headers();
    const identity = requireTraderLinkPlatformAuthenticatedRequestIdentity(requestHeaders);
    const saved = withPlatformDatabase({ mode: "runtime" }, database => {
      if (!readPlatformHomeAccess(database, identity, requestHeaders).homePages[value]) return false;

      new PlatformUserPreferenceRepository(database).updateActiveUserHomePage({
        homePage: value,
        updatedAtUtc: createCanonicalUtcTimestamp(),
        userId: identity.scope.userId,
      });
      return true;
    });
    if (!saved) return { ok: false, message: "This page is currently unavailable. Choose a different home page." };

    revalidatePath("/account/preferences");
    return { ok: true, homePage: value };
  } catch {
    return { ok: false, message: "Your home page could not be saved. Try again." };
  }
}
