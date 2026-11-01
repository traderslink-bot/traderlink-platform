import { describe, expect, it } from "vitest";
import { escapeDiscordAnnouncementTitle } from "./community-discord-text";
describe("community announcement title", () => {
  it("escapes masked links and formatting", () => {
    expect(escapeDiscordAnnouncementTitle("[x](https://x.test)")).toBe("\\[x\\]\\(https://x.test\\)");
    expect(escapeDiscordAnnouncementTitle("**hi** @everyone")).toBe("\\*\\*hi\\*\\* @\u200beveryone");
  });
  it("keeps ordinary titles readable", () => expect(escapeDiscordAnnouncementTitle("My trades 2026")).toBe("My trades 2026"));
});
