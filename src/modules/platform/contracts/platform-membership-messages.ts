export const MEMBERSHIP_FEATURE_REQUIRED_MESSAGE = "Your current plans do not include this feature. Review Plans or contact the owner.";

export function throwIfMembershipRequired(value: unknown): void {
  if (value && typeof value === "object" && "code" in value && value.code === "membership_required") {
    throw new Error("membership_required");
  }
}

export function membershipActionError(error: unknown): string | null {
  return error instanceof Error && error.message === "membership_required" ? MEMBERSHIP_FEATURE_REQUIRED_MESSAGE : null;
}
