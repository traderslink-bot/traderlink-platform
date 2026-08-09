import { NextResponse, type NextRequest } from "next/server";

import { requireTraderLinkPlatformRequestIdentity } from "@/src/modules/platform/server/authentication/require-platform-request-scope";
import {
  encryptMoomooCredentials,
  loadMoomooCredentialKeyConfiguration,
} from "@/src/modules/platform/server/broker-connections/moomoo-connection-credentials";
import { MoomooConnectionRepository } from "@/src/modules/platform/server/broker-connections/moomoo-connection-repository";
import { MoomooExecutionImportRepository } from "@/src/modules/journal/server/broker-imports/moomoo-execution-import-repository";
import { recordMoomooOperationFailure } from "@/src/modules/platform/server/broker-connections/moomoo-operation-observability";
import { createCanonicalUtcTimestamp } from "@/src/modules/platform/server/database/platform-migration-contract";
import { openPlatformDatabase } from "@/src/modules/platform/server/database/open-platform-database";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function DELETE(request: NextRequest): Promise<NextResponse> {
  const database = openPlatformDatabase({ mode: "runtime" });
  try {
    const identity = requireTraderLinkPlatformRequestIdentity(request.headers);
    const timestamp = createCanonicalUtcTimestamp(new Date());
    database.transaction(() => {
      const connection = new MoomooConnectionRepository(database).find(identity.scope);
      if (!connection) throw new Error("moomoo_connection_missing");
      new MoomooConnectionRepository(database).revoke(identity.scope, {
        encrypted: encryptMoomooCredentials({
          configuration: loadMoomooCredentialKeyConfiguration(),
          credentials: Object.freeze({ accessToken: "revoked", refreshToken: "revoked" }),
        }),
        timestamp,
      });
      new MoomooExecutionImportRepository(database)
        .disconnectLinksForConnection(connection.connectionId, timestamp);
    }).immediate();
    return new NextResponse(null, { status: 204 });
  } catch (error) {
    const reportedToAdmin = recordMoomooOperationFailure({
      database,
      error,
      stage: "disconnect",
    });
    return NextResponse.json({
      ok: false,
      message: "The Moomoo connection could not be disconnected. Try again.",
      reportedToAdmin,
    }, { status: 400 });
  } finally {
    database.close();
  }
}
