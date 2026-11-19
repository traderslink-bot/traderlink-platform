// @vitest-environment node
import { expect, it, vi } from "vitest";
import { createPartnerAlertDiscordMessageRest } from "./partner-alert-discord-message-rest";

const target = { communityId: "10000000-0000-4000-8000-000000000001", sourceGuildId: "810000000000000101",
  sourceChannelId: "810000000000000102", destinationGuildId: "810000000000000103",
  destinationChannelId: "810000000000000104", destinationRoleId: "810000000000000105" };
const mappingId = "10000000-0000-4000-8000-000000000002";
const botUserId = "810000000000000106";
const messageId = "810000000000000107";
const nonce = "e".repeat(25);
const path = `https://discord.com/api/v10/channels/${target.destinationChannelId}/messages`;
const message = { id: messageId, channel_id: target.destinationChannelId, author: { id: botUserId } };
const scope = { mappingId, channelId: target.destinationChannelId, stillCurrent: () => true };

function fixture() {
  const transport = vi.fn<(url: string, options: RequestInit) => Promise<Response>>();
  const verify = vi.fn(async () => undefined);
  const rest = createPartnerAlertDiscordMessageRest({ botToken: "synthetic-discord-message-token", botUserId,
    maximumDurationMs: 7_000, transport }, {
    canReadSource: (guild, channel) => guild === target.sourceGuildId && channel === target.sourceChannelId,
    readDestination: (mapping, channel) => mapping === mappingId && channel === target.destinationChannelId ? target : null,
    verifyPrivateDestination: verify,
  });
  return { transport, rest, verify };
}

it("verifies the exact destination and sends a nonce-enforced alert with mentions disabled", async () => {
  const { rest, transport, verify } = fixture();
  transport.mockResolvedValueOnce(Response.json({ ...message, nonce }));
  expect(await rest.verifyDestination(mappingId, target.destinationChannelId, "create")).toBe(true);
  expect(verify).toHaveBeenCalledWith(target, expect.any(AbortSignal));
  const content = "Approved synthetic text";
  expect(await rest.create({ ...scope, content, nonce, suppressMentions: true }))
    .toEqual({ kind: "confirmed", messageId, channelId: target.destinationChannelId });
  expect(transport.mock.calls[0]?.[0]).toBe(path);
  const init = transport.mock.calls[0]![1];
  expect(init).toMatchObject({ method: "POST", redirect: "manual" });
  expect(JSON.parse(init.body as string)).toEqual({ content, flags: 4, allowed_mentions: { parse: [] }, nonce, enforce_nonce: true });
  expect(await rest.create({ ...scope, channelId: target.sourceChannelId, content, nonce, suppressMentions: true }))
    .toMatchObject({ kind: "not_written" });
  expect(transport).toHaveBeenCalledOnce();
});

it("rechecks the admitted job after the ownership read and preserves messages sent by other authors", async () => {
  const { rest, transport } = fixture();
  let current = true;
  transport.mockImplementationOnce(async () => { current = false; return Response.json(message); });
  expect(await rest.edit({ ...scope, messageId, content: "Correction", suppressMentions: true, stillCurrent: () => current }))
    .toMatchObject({ kind: "not_written" });
  transport.mockResolvedValueOnce(Response.json({ ...message, author: { id: "810000000000000108" } }));
  expect(await rest.delete({ ...scope, messageId })).toEqual({ kind: "rejected", reason: "permission_required" });
  expect(transport.mock.calls.map(([url, init]) => [url, init.method])).toEqual([[`${path}/${messageId}`, "GET"], [`${path}/${messageId}`, "GET"]]);
});

it("uses the provider backoff and holds unclear writes for reconciliation", async () => {
  const { rest, transport } = fixture();
  const input = { ...scope, content: "Test", suppressMentions: true as const, nonce };
  transport.mockResolvedValueOnce(Response.json({ retry_after: 17.5 }, { status: 429, headers: { "retry-after": "16" } }));
  expect(await rest.create(input)).toEqual({ kind: "retry", delayMs: 17_500, reason: "rate_limited" });
  transport.mockRejectedValueOnce(new Error("Connection closed"));
  expect(await rest.create(input)).toEqual({ kind: "uncertain" });
  transport.mockResolvedValueOnce(Response.json({ ...message, nonce: "f".repeat(25) }));
  expect(await rest.create(input)).toEqual({ kind: "uncertain" });
});

it("treats only an exact Discord missing-message response as a source or destination deletion", async () => {
  const { rest, transport } = fixture();
  expect(await rest.hydrate(target.destinationGuildId, target.destinationChannelId, messageId, () => true))
    .toEqual({ kind: "unavailable" });
  expect(transport).not.toHaveBeenCalled();
  transport.mockResolvedValueOnce(Response.json({ code: 10003 }, { status: 404 }));
  expect(await rest.hydrate(target.sourceGuildId, target.sourceChannelId, messageId, () => true)).toEqual({ kind: "unavailable" });
  transport.mockResolvedValueOnce(Response.json({ code: 10008 }, { status: 404 }));
  expect(await rest.hydrate(target.sourceGuildId, target.sourceChannelId, messageId, () => true)).toEqual({ kind: "deleted" });
  transport.mockResolvedValueOnce(Response.json({ code: 10008 }, { status: 404 }));
  expect(await rest.delete({ ...scope, messageId })).toEqual({ kind: "confirmed", channelId: target.destinationChannelId, messageId });
  expect(transport.mock.calls.every(([, init]) => init.method === "GET")).toBe(true);
});
