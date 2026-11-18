// @vitest-environment node
import { describe, expect, it } from "vitest";
import { evaluatePartnerAlertContent, splitPartnerAlertText } from "./partner-alert-content-policy";
import { partnerAlertAmountToMinor } from "./partner-alert-publishing-pricing";
import type { PartnerAlertSourceMessage } from "./partner-alert-contracts";

const at = "2026-11-03T12:00:00.000Z";
const mapping = { mappingId: "11111111-1111-4111-8111-111111111111",
  communityId: "22222222-2222-4222-8222-222222222222", sourceGuildId: "850000000000000010",
  sourceChannelId: "850000000000000011", destinationChannelId: "850000000000000012", displayName: "Market alerts" };
const policy = { authorMode: "all_humans", allowedAuthorIds: [], mirrorBotUserId: "850000000000000099",
  blockedServerNames: ["Northstar Trading"], blockedPhrases: ["join our club"] };
const original: PartnerAlertSourceMessage = { messageId: "850000000000000020", guildId: mapping.sourceGuildId,
  channelId: mapping.sourceChannelId, authorId: "850000000000000021", botAuthored: false, webhookAuthored: false,
  messageType: 0, text: "ABC entry 12.30; stop 12.10; target 12.80", createdAtUtc: at, editedAtUtc: null,
  attachmentCount: 0, embedCount: 0, stickerCount: 0, componentCount: 0, hasPoll: false };
const assess = (change: Partial<PartnerAlertSourceMessage> = {}) => evaluatePartnerAlertContent({
  message: { ...original, ...change }, mapping, policy, activatedAtUtc: at, nowUtc: at });

describe("Partner alert complete-message and price regression", () => {
  it("preserves an ordinary decimal-price alert exactly and suppresses mentions", () => {
    expect(assess()).toEqual({ action: "allow", text: original.text, parts: [original.text], suppressMentions: true });
  });
  it("allows a legitimate source server name in ordinary alert text", () => {
    const text = `Northstar Trading: ${original.text}`;
    expect(assess({ text })).toMatchObject({ action: "allow", text, parts: [text] });
  });
  it.each(["https://example.com", "discord [dot] gg / invite", "https%3A%2F%2Fexample.com",
    "[alert](https://example.com)", "@everyone entry now", "Join Northstar Trading now", "join our club"])(
    "holds the entire alert rather than stripping prohibited content: %s", text => {
      const result = assess({ text: `${original.text}\n${text}` });
      expect(result.action).toBe("hold"); expect(result).not.toHaveProperty("parts");
    });
  it.each(["attachmentCount", "embedCount", "stickerCount", "componentCount"] as const)(
    "holds text when %s is present", key => expect(assess({ [key]: 1 })).toMatchObject({ action: "hold", issues: ["unsupported_media"] }));
  it("holds a poll", () => expect(assess({ hasPoll: true })).toMatchObject({ action: "hold", issues: ["unsupported_media"] }));
  it("ignores unapproved bot authors", () => expect(assess({ botAuthored: true })).toEqual({ action: "ignore", reason: "author_not_allowed" }));
  it("ignores another source channel", () => expect(assess({ channelId: "850000000000000030" })).toEqual({ action: "ignore", reason: "unmapped_source" }));
  it("does not replay messages preceding activation", () => expect(assess({ createdAtUtc: "2026-11-03T11:59:00.000Z" })).toEqual({ action: "ignore", reason: "before_activation" }));
  it("reconstructs a long Unicode alert without changing a character or splitting emoji", () => {
    const text = ("ABC 12.30 → 12.80 🚀\n").repeat(650);
    const parts = splitPartnerAlertText(text);
    expect(parts.length).toBeGreaterThan(1); expect(parts.join("")).toBe(text);
    for (const part of parts) { expect(part.length).toBeLessThanOrEqual(1850); expect(part.isWellFormed()).toBe(true); }
  });
  it("rejects malformed Unicode and oversized content", () => {
    expect(() => splitPartnerAlertText("ABC\ud800")).toThrow();
    expect(assess({ text: "A".repeat(32001) })).toMatchObject({ action: "hold", issues: ["oversized_text"] });
  });
  it.each([["USD", 2, "12.30", 1230], ["JPY", 0, "1500", 1500], ["KWD", 3, "1.005", 1005]] as const)(
    "parses exact %s minor units", (code, minorUnitDigits, text, expected) => expect(partnerAlertAmountToMinor(text, { code, minorUnitDigits })).toBe(expected));
  it.each(["1e3", "-1.00", "12.345", "9007199254740991.99"])("rejects ambiguous/inexact USD amount %s", text => {
    expect(() => partnerAlertAmountToMinor(text, { code: "USD", minorUnitDigits: 2 })).toThrow();
  });
});
