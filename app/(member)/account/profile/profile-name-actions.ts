"use server";

import { revalidatePath } from "next/cache";
import { PlatformProfileNameError } from "@/src/modules/platform/contracts/platform-profile-name";
import { requireTraderLinkPlatformAuthenticatedPageIdentity } from "@/src/modules/platform/server/authentication/require-platform-request-scope";
import { createCanonicalUtcTimestamp } from "@/src/modules/platform/server/database/platform-migration-contract";
import { withPlatformDatabase } from "@/src/modules/platform/server/database/open-platform-database";
import { PlatformProfileNameRepository } from "@/src/modules/platform/server/identity/platform-profile-name-repository";

export async function saveProfileName(value: unknown): Promise<
  Readonly<{ ok: true; displayName: string }> | Readonly<{ ok: false; message: string }>
> {
  try {
    const { scope } = await requireTraderLinkPlatformAuthenticatedPageIdentity();
    const displayName = withPlatformDatabase({ mode: "runtime" }, database =>
      new PlatformProfileNameRepository(database).save(scope.userId, value, createCanonicalUtcTimestamp()));
    revalidatePath("/account/profile");
    return { ok: true, displayName };
  } catch (error) {
    return { ok: false, message: error instanceof PlatformProfileNameError
      ? error.message : "Your profile name could not be saved. Try again." };
  }
}
