import { NextResponse, type NextRequest } from "next/server";

import { requireTraderLinkPlatformRequestIdentity } from "@/src/modules/platform/server/authentication/require-platform-request-scope";
import {
  encryptMoomooCredentials,
  loadMoomooCredentialKeyConfiguration,
} from "@/src/modules/platform/server/broker-connections/moomoo-connection-credentials";
import { MoomooConnectionRepository } from "@/src/modules/platform/server/broker-connections/moomoo-connection-repository";
import { createCanonicalUtcTimestamp } from "@/src/modules/platform/server/database/platform-migration-contract";
import { withPlatformDatabase } from "@/src/modules/platform/server/database/open-platform-database";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function DELETE(request: NextRequest): Promise<NextResponse> {
  try {
    const identity = requireTraderLinkPlatformRequestIdentity(request.headers);
    const timestamp = createCanonicalUtcTimestamp(new Date());
    withPlatformDatabase({ mode: "runtime" }, (database) => {
      new MoomooConnectionRepository(database).revoke(identity.scope, {
        encrypted: encryptMoomooCredentials({
          configuration: loadMoomooCredentialKeyConfiguration(),
          credentials: Object.freeze({ accessToken: "revoked", refreshToken: "revoked" }),
        }),
        timestamp,
      });
    });
    return new NextResponse(null, { status: 204 });
  } catch {
    return NextResponse.json({ ok: false }, { status: 400 });
  }
}
