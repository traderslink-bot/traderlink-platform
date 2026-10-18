import { expect, it } from "vitest";
import { isMembershipRequired } from "./platform-membership-messages";

it("recognizes policy failures in API packets, actions and thrown errors only by code", () => {
  for (const value of [{ code: "membership_required" }, { error: { code: "membership_required" } }, Object.assign(new Error("limit"), { code: "membership_required" })]) expect(isMembershipRequired(value)).toBe(true);
  for (const value of [null, {}, new Error("membership_required"), { code: "validation_failed" }, { error: { message: "Your plan" } }]) expect(isMembershipRequired(value)).toBe(false);
});
