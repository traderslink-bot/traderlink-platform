// @vitest-environment node
import { NextRequest } from "next/server";
import { afterEach, describe, expect, it, vi } from "vitest";
vi.mock("./require-platform-request-scope", () => ({
  requireTraderLinkPlatformRequestIdentity: () => ({ mode: "platform_session" }),
  requireTraderLinkPlatformDiscordMemberRequestIdentity: () => ({ mode: "platform_session" }),
}));
import { GET } from "@/app/api/auth/discord/login/route";

afterEach(() => vi.unstubAllEnvs());
describe("Discord account-change reauthentication", () => {
  it("starts provider authorization with consent even when a valid app session exists", async () => {
    vi.stubEnv("TRADERLINK_PLATFORM_PUBLIC_ORIGIN", "https://login.example.test");
    vi.stubEnv("DISCORD_CLIENT_ID", "synthetic-client");
    vi.stubEnv("DISCORD_CLIENT_SECRET", "synthetic-secret");
    vi.stubEnv("DISCORD_REDIRECT_URI", "https://login.example.test/api/auth/discord/callback");
    const request = new NextRequest("https://login.example.test/api/auth/discord/login?returnTo=/account/login&prompt=consent");
    const response = await GET(request);
    const target = new URL(response.headers.get("location")!);
    expect(target.hostname).toBe("discord.com");
    expect(target.searchParams.get("prompt")).toBe("consent");
    expect(target.searchParams.get("state")).toBeTruthy();
    expect(response.headers.get("set-cookie")).toContain("HttpOnly");
  });
});
