import {
  findUserFacingBehaviorContract,
} from "../registry/user-facing-behavior-registry";
import type {
  MappedUserFacingBehavior,
  MapUserFacingBehaviorInput,
  UserFacingBehaviorRoute,
  UserFacingBehaviorTone,
} from "../types/user-facing-behavior-contract";

const FAIL_CLOSED_LABEL = "Review behavior in advanced details";

function normalizeRoute(
  route: MapUserFacingBehaviorInput["route"],
): UserFacingBehaviorRoute | null {
  if (
    route === "/intelligence/coach" ||
    route === "/intelligence/analytics" ||
    route === "/intelligence/review" ||
    route === "/intelligence/progress" ||
    route === "/intelligence/trades" ||
    route === "/intelligence/trades/[tradeId]" ||
    route === "advanced"
  ) {
    return route;
  }

  if (typeof route === "string" && route.startsWith("/intelligence/trades/")) {
    return "/intelligence/trades/[tradeId]";
  }

  return null;
}

function fallbackTone(rawLabel: string | null): UserFacingBehaviorTone {
  if (!rawLabel) {
    return "neutral";
  }

  const value = rawLabel.toLowerCase();

  if (
    value.includes("risk") ||
    value.includes("los") ||
    value.includes("weak") ||
    value.includes("adverse")
  ) {
    return "warning";
  }

  if (
    value.includes("strength") ||
    value.includes("profit") ||
    value.includes("clean")
  ) {
    return "strength";
  }

  return "neutral";
}

function isRouteAllowed(
  route: UserFacingBehaviorRoute | null,
  routesAllowed: readonly UserFacingBehaviorRoute[],
): boolean {
  if (!route) {
    return true;
  }

  return routesAllowed.includes(route);
}

function labelForContract(
  contract: NonNullable<ReturnType<typeof findUserFacingBehaviorContract>>,
  originalLabel: string | null,
): string {
  if (
    contract.behaviorId === "overtraded_same_ticker" &&
    originalLabel &&
    /^Repeated risky .+ trades$/i.test(originalLabel)
  ) {
    return originalLabel;
  }

  return contract.userFacingLabel;
}

export function mapUserFacingBehavior(
  input: MapUserFacingBehaviorInput,
): MappedUserFacingBehavior {
  const originalBehaviorId = input.behaviorId ?? null;
  const originalLabel = input.rawLabel ?? null;
  const contract =
    findUserFacingBehaviorContract(input.behaviorId) ??
    findUserFacingBehaviorContract(input.rawLabel);
  const route = normalizeRoute(input.route);

  if (!contract || !isRouteAllowed(route, contract.routesAllowed)) {
    return {
      advancedHowDetected: originalBehaviorId
        ? `Unmapped behavior id: ${originalBehaviorId}.`
        : originalLabel
          ? `Unmapped behavior label: ${originalLabel}.`
          : "No behavior identifier was provided.",
      behaviorId: originalBehaviorId ?? "unmapped_behavior",
      canDrivePrimaryConclusion: false,
      contractFound: false,
      copySafetyNotes: [
        "Unknown or route-disallowed behavior must not render as a primary UI conclusion.",
      ],
      evidenceChannel: "execution_only",
      evidenceSentence:
        "The app has not certified this behavior for normal user-facing coaching.",
      fixFirstAction:
        "Open the trade replay and write a manual review note before treating this as a coaching conclusion.",
      label: FAIL_CLOSED_LABEL,
      missingDataSentence:
        "A product-facing behavior contract is required before this can appear as a confident conclusion.",
      opportunityType: "internal_only",
      originalBehaviorId,
      originalLabel,
      plainExplanation:
        "This signal is being kept out of primary UI because it does not have a certified user-facing contract.",
      routesAllowed: ["advanced"],
      state: "internal_only",
      tone: fallbackTone(originalLabel),
      unsupportedFallback:
        "Review the trade manually and keep the raw signal in advanced details.",
    };
  }

  return {
    advancedHowDetected: contract.advancedHowDetected,
    behaviorId: contract.behaviorId,
    canDrivePrimaryConclusion: contract.state === "certified_detection",
    contractFound: true,
    copySafetyNotes: contract.copySafetyNotes,
    evidenceChannel: contract.evidenceChannel,
    evidenceSentence: contract.evidenceSentence,
    fixFirstAction: contract.fixFirstAction,
    label: labelForContract(contract, originalLabel),
    missingDataSentence: contract.missingDataSentence,
    opportunityType: contract.opportunityType,
    originalBehaviorId,
    originalLabel,
    plainExplanation: contract.plainExplanation,
    routesAllowed: contract.routesAllowed,
    state: contract.state,
    tone: contract.tone,
    unsupportedFallback: contract.unsupportedFallback,
  };
}

export function canDrivePrimaryBehaviorConclusion(
  input: MapUserFacingBehaviorInput,
): boolean {
  return mapUserFacingBehavior(input).canDrivePrimaryConclusion;
}
