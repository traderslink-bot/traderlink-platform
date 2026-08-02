import { platformFailure } from "@/src/modules/platform/server/database/platform-migration-contract";

export const TRADERLINK_LEVEL_ANALYSIS_ALLOWED_PROVIDERS_ENV =
  "TRADERLINK_LEVEL_ANALYSIS_ALLOWED_PROVIDERS";
export const LEVEL_ANALYSIS_DELIVERY_MAX_BYTES = 2 * 1024 * 1024;

const PROVIDER_PATTERN = /^[a-z][a-z0-9_-]{0,63}$/u;
const FORBIDDEN_WRAPPER_FIELDS = new Set([
  "allowedPackagedProviders",
  "workspaceId",
  "accountId",
  "userId",
  "createdAt",
  "databasePath",
]);

function record(value: unknown): Record<string, unknown> | null {
  return value !== null && typeof value === "object" && !Array.isArray(value)
    ? value as Record<string, unknown>
    : null;
}

export function readConfiguredLevelAnalysisProviders(
  environment: Readonly<Record<string, string | undefined>> = process.env,
): readonly string[] {
  const configured = environment[TRADERLINK_LEVEL_ANALYSIS_ALLOWED_PROVIDERS_ENV];
  if (configured === undefined || configured.trim() === "") return Object.freeze([]);
  if (configured.length > 1024) {
    platformFailure("TRADERLINK_LEVEL_ANALYSIS_CONFIGURATION_INVALID");
  }
  const providers = [...new Set(configured.split(",").map((value) => value.trim()))];
  if (
    providers.length === 0 || providers.length > 16 ||
    providers.some((provider) => !PROVIDER_PATTERN.test(provider))
  ) {
    platformFailure("TRADERLINK_LEVEL_ANALYSIS_CONFIGURATION_INVALID");
  }
  return Object.freeze(providers);
}

export async function readBoundedLevelAnalysisDeliveryPayload(
  request: Request,
  maximumBytes = LEVEL_ANALYSIS_DELIVERY_MAX_BYTES,
): Promise<unknown> {
  const contentLength = request.headers.get("content-length");
  if (contentLength !== null) {
    if (!/^[0-9]+$/u.test(contentLength) || Number(contentLength) > maximumBytes) {
      platformFailure("TRADERLINK_LEVEL_ANALYSIS_DELIVERY_INVALID", {
        reason: "payload_too_large",
      });
    }
  }

  const raw = await request.text();
  if (Buffer.byteLength(raw, "utf8") > maximumBytes) {
    platformFailure("TRADERLINK_LEVEL_ANALYSIS_DELIVERY_INVALID", {
      reason: "payload_too_large",
    });
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch (error) {
    platformFailure("TRADERLINK_LEVEL_ANALYSIS_DELIVERY_INVALID", {
      reason: "invalid_json",
    }, error);
  }

  const wrapper = record(parsed);
  if (wrapper && "payload" in wrapper) {
    if (
      Object.keys(wrapper).some((key) => key !== "payload") ||
      Object.keys(wrapper).some((key) => FORBIDDEN_WRAPPER_FIELDS.has(key))
    ) {
      platformFailure("TRADERLINK_LEVEL_ANALYSIS_DELIVERY_INVALID", {
        reason: "request_owned_authority_forbidden",
      });
    }
    return wrapper.payload;
  }
  return parsed;
}
