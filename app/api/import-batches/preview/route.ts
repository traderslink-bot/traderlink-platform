import {
  buildDurableImportCommitPlan,
  importCommitErrorResponse,
  parseImportCommitRequestInput,
  readJsonRequest,
} from "../../../../src/lib/trader-analytics/server/import-commit-service";
import { SqliteImportCommitRepository } from "../../../../src/lib/trader-analytics/product/import-commit/sqlite-import-commit-repository";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request): Promise<Response> {
  let input;

  try {
    input = parseImportCommitRequestInput(await readJsonRequest(request));
  } catch (error) {
    return importCommitErrorResponse(
      400,
      error instanceof Error && error.message.startsWith("Invalid JSON")
        ? "invalid_json"
        : "invalid_request",
      error instanceof Error ? error.message : String(error),
    );
  }

  const repository = new SqliteImportCommitRepository();
  const plan = buildDurableImportCommitPlan({ input, repository });
  repository.savePreviewPlan(plan);

  return Response.json({
    contractVersion: "import_commit_api_plan_v1",
    plan,
  });
}
