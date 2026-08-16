import { describe, expect, it } from "vitest";

import { CoachAiChatProductHelpService } from
  "./coach-ai-chat-product-help-service";

describe("CoachAiChatProductHelpService", () => {
  it("returns the maintained paid-plan guide on an allowlisted local route", () => {
    const results = new CoachAiChatProductHelpService().search({
      query: "manage subscription billing",
      limit: 8,
    });

    expect(results).toContainEqual(expect.objectContaining({
      section: "Paid plan and billing",
      href: expect.stringMatching(/^\/help\/paid-plan(?:\/|$)/u),
    }));
    expect(results.every((result) => result.href.startsWith("/help/"))).toBe(true);
  });
});
