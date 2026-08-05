import "server-only";

import { JOURNAL_MUTATION_REQUEST_HEADER } from "../../contracts/journal-request-security";
import { platformFailure } from "../database/platform-migration-contract";

const MUTATION_METHODS = new Set(["POST", "PUT", "PATCH", "DELETE"]);

export function requireJournalMutationRequest(request: Request): void {
  if (!MUTATION_METHODS.has(request.method)) {
    platformFailure("TRADERLINK_WORKSPACE_ACCESS_DENIED");
  }
  if (
    request.headers.get("sec-fetch-site") !== "same-origin" ||
    request.headers.get(JOURNAL_MUTATION_REQUEST_HEADER) !== "1"
  ) {
    platformFailure("TRADERLINK_WORKSPACE_ACCESS_DENIED");
  }
  const origin = request.headers.get("origin");
  const host = request.headers.get("host");
  if (!origin || !host) {
    platformFailure("TRADERLINK_WORKSPACE_ACCESS_DENIED");
  }
  let parsed: URL;
  try {
    parsed = new URL(origin);
  } catch {
    platformFailure("TRADERLINK_WORKSPACE_ACCESS_DENIED");
  }
  if (
    parsed.username ||
    parsed.password ||
    !["http:", "https:"].includes(parsed.protocol) ||
    parsed.host.toLowerCase() !== host.toLowerCase()
  ) {
    platformFailure("TRADERLINK_WORKSPACE_ACCESS_DENIED");
  }
}
