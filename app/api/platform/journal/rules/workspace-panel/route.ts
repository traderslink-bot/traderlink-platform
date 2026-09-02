import { readTradingRulesPageModel } from "@/app/(dashboard)/rules/rules-page-data";
import { readRuleResults } from "@/app/(dashboard)/rules/results/rule-results-data";
import { JournalWorkspaceRuleResultsCardPreferenceService } from "@/src/modules/journal/server/rules/journal-workspace-rule-results-card-preference";
import { requireTraderLinkPlatformRequestScope } from "@/src/modules/platform/server/authentication/require-platform-request-scope";
import { withReadonlyPlatformDatabase } from "@/src/modules/platform/server/database/open-readonly-platform-database";
import { isTraderLinkPlatformError } from "@/src/modules/platform/server/database/platform-migration-contract";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const HEADERS = { "cache-control": "private, no-store, max-age=0" };

export async function GET(request: Request): Promise<Response> {
  try {
    const scope = requireTraderLinkPlatformRequestScope(request.headers);
    const [rules, results] = await Promise.all([
      readTradingRulesPageModel(scope),
      readRuleResults(scope),
    ]);
    const preference = withReadonlyPlatformDatabase({}, (database) =>
      new JournalWorkspaceRuleResultsCardPreferenceService(database).read(scope));
    return Response.json({ data: Object.freeze({ preference, results, rules }), status: "ready" }, { headers: HEADERS });
  } catch (error) {
    return Response.json({ status: "unavailable" }, { headers: HEADERS, status: isTraderLinkPlatformError(error) ? 400 : 500 });
  }
}
