// @vitest-environment node
import { expect, it, vi } from "vitest";
import { createPartnerAlertDiscordRoleRest } from "./partner-alert-discord-role-rest";

const guildId = "810000000000000001";
const roleId = "810000000000000002";
const memberId = "810000000000000003";
const path = `/guilds/${guildId}/members/${memberId}/roles/${roleId}`;
const config = {
  botUserId: "810000000000000004",
  botToken: "synthetic_discord_bot_token",
  maximumDurationMs: 100,
};

it("refuses requests outside the exact guild and role before loading the transport", async () => {
  const transport = vi.fn();
  const rest = createPartnerAlertDiscordRoleRest({ ...config, transport }, { guildId, roleId });
  for (const denied of [
    `${path}/`, `${path}?extra=true`, `${path}\n`, path.replace(roleId, memberId),
    path.replace(guildId, memberId), path.replace(memberId, "18446744073709551616"),
  ]) {
    await expect(rest.request({ method: "DELETE", path: denied })).rejects.toThrow("unavailable");
  }
  await expect(rest.request({ method: "GET", path: `/guilds/${guildId}/members` })).rejects.toThrow("unavailable");
  expect(transport).not.toHaveBeenCalled();
});

it("refuses redirects and oversized responses and preserves qualified retry and absence statuses", async () => {
  const transport = vi.fn()
    .mockResolvedValueOnce(new Response(null, { status: 302, headers: { location: "https://outside.invalid" } }))
    .mockResolvedValueOnce(Response.json({ code: 10007 }, { status: 404, headers: { "content-length": "1000001" } }))
    .mockResolvedValueOnce(Response.json({ retry_after: 2 }, { status: 429 }))
    .mockResolvedValueOnce(Response.json({ code: 10007 }, { status: 404 }));
  const rest = createPartnerAlertDiscordRoleRest({ ...config, transport }, { guildId, roleId });
  const remove = () => rest.request({ method: "DELETE", path, auditReason: "Reconcile exact role" });
  await expect(remove()).rejects.toThrow("unavailable");
  await expect(remove()).rejects.toThrow("unavailable");
  await expect(remove()).resolves.toEqual({ status: 429, body: { retry_after: 2 } });
  await expect(remove()).resolves.toEqual({ status: 404, body: { code: 10007 } });
  expect(transport).toHaveBeenCalledTimes(4);
  expect(transport).toHaveBeenCalledWith(`https://discord.com/api/v10${path}`, expect.objectContaining({
    redirect: "manual", cache: "no-store", headers: expect.objectContaining({ "x-audit-log-reason": "Reconcile%20exact%20role" }),
  }));
});

it("cancels a stalled response body", async () => {
  const cancel = vi.fn();
  const transport = async () => new Response(new ReadableStream({ cancel }), {
    headers: { "content-type": "application/json" },
  });
  const rest = createPartnerAlertDiscordRoleRest({ ...config, transport }, { guildId, roleId });
  await expect(rest.request({ method: "GET", path: "/users/@me" })).rejects.toThrow("unavailable");
  expect(cancel).toHaveBeenCalledOnce();
});
