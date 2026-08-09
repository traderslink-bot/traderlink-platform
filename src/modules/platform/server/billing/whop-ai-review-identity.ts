import { createHmac } from "node:crypto";

export function createWhopPrivacyReference(
  rawReference: string,
  namespace: "company" | "membership" | "platform_user" | "product" | "user",
  key: string,
): string {
  if (!rawReference.trim() || key.length < 32) {
    throw new Error("TRADERLINK_WHOP_IDENTITY_INVALID");
  }
  return createHmac("sha256", key)
    .update(`${namespace}\0${rawReference.trim()}`, "utf8")
    .digest("hex");
}
