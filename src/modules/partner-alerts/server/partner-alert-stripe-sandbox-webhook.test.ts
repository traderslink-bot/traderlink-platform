// @vitest-environment node
import { createHmac, randomBytes, randomUUID } from "node:crypto";
import { readFileSync } from "node:fs";
import Database from "better-sqlite3";
import { expect, it } from "vitest";
import { qualifiedPaidInput } from "../contracts/partner-alert-access-policy.test-fixture";
import { createPartnerAlertDiscordRoleRest } from "./partner-alert-discord-role-rest";
import { createPartnerAlertManagedRoleTransport } from "./partner-alert-managed-role-transport";
import { createPartnerAlertStripeDiscordTestGuild } from "./partner-alert-stripe-discord-test-guild";
import { createPartnerAlertStripeSandboxWebhook } from "./partner-alert-stripe-sandbox-webhook";

const fixture = process.env.PARTNER_STRIPE_SANDBOX_CAPTURE;
type SandboxResource = {
  id: string; status?: string; charge?: string; latest_charge?: string; payment_intent?: string;
  livemode?: boolean; cancel_at_period_end?: boolean;
  parent?: { subscription_details?: { subscription?: string } };
};
type Evidence = {
  subscription?: string; invoice?: string; invoice_payment?: string; payment_intent?: string;
  charge?: string; dispute?: string; line?: string; price?: string; period?: { start: number; end: number };
};
type Capture = {
  evidence: Record<string, Evidence>;
  events: { id: string; type: string; livemode: boolean; data: { object: SandboxResource } }[];
  delivery?: Record<string, {raw: string; signature: string}>;
  verification: {
    latePayment: PaymentList;
    lateLines: LineList;
    disputeLinks: Record<string, { invoicePayment: PaymentList; intent: SandboxResource; charge: SandboxResource; invoiceLines: LineList }>;
  };
};
type PaymentList = { has_more: boolean; data: { id: string; invoice: string; status: string; livemode: boolean;
  payment: { payment_intent: string } }[] };
type LineList = { has_more: boolean; data: { id: string; period: {start: number; end: number};
  pricing: {price_details: {price: string}}; parent: {type: string} }[] };

it.skipIf(!fixture)("replays real Stripe sandbox events and removes only the reviewed managed Discord role", async () => {
  const capture = JSON.parse(readFileSync(fixture!, "utf8")) as Capture;
  const { evidence, events, verification } = capture;
  const late = evidence.late_renewal!;
  const won = evidence.dispute_won!;
  const lost = evidence.dispute_lost!;
  const scheduled = evidence.period_end_cancel!;
  const immediate = evidence.immediate_cancel!;
  const receipt = (payments: PaymentList, purchase: Evidence) => {
    expect(payments.has_more).toBe(false);
    expect(payments.data).toHaveLength(1);
    expect(payments.data[0]).toMatchObject({ id: purchase.invoice_payment, invoice: purchase.invoice,
      status: "paid", livemode: false, payment: { payment_intent: purchase.payment_intent } });
  };
  receipt(verification.latePayment, late);
  expect(verification.lateLines.has_more).toBe(false);
  expect(verification.lateLines.data).toContainEqual(expect.objectContaining({
    id: late.line, period: late.period, pricing: expect.objectContaining({price_details: expect.objectContaining({price: late.price})}),
    parent: expect.objectContaining({type: "subscription_item_details"}),
  }));
  for (const purchase of [won, lost]) {
    const linkage = verification.disputeLinks[purchase.dispute!]!;
    receipt(linkage.invoicePayment, purchase);
    expect(linkage.intent).toMatchObject({ id: purchase.payment_intent, latest_charge: purchase.charge, livemode: false });
    expect(linkage.charge).toMatchObject({ id: purchase.charge, payment_intent: purchase.payment_intent, livemode: false });
    expect(linkage.invoiceLines.has_more).toBe(false);
    expect(linkage.invoiceLines.data).toContainEqual(expect.objectContaining({
      pricing: expect.objectContaining({price_details: expect.objectContaining({price: late.price})}),
      parent: expect.objectContaining({type: "subscription_item_details"}),
    }));
  }

  const db = new Database(":memory:");
  let realGuild: Awaited<ReturnType<typeof createPartnerAlertStripeDiscordTestGuild>> | undefined;
  try {
    if (process.env.PARTNER_STRIPE_REAL_DISCORD === "1") {
      if (process.env.PARTNER_STRIPE_REQUIRE_DELIVERY !== "1") throw new Error("Fresh Stripe sandbox delivery is required.");
      realGuild = await createPartnerAlertStripeDiscordTestGuild({
        guildId: process.env.PARTNER_STRIPE_DISCORD_GUILD_ID ?? "",
        memberId: process.env.PARTNER_STRIPE_DISCORD_MEMBER_ID ?? "",
        botToken: process.env.PARTNER_STRIPE_DISCORD_BOT_TOKEN ?? "",
      });
      await realGuild.prepare();
    }
    const { ticket, offers, mappingId, userId, communityId } = qualifiedPaidInput();
    const guildId = realGuild?.guildId ?? ticket.context.guildId;
    const roleId = realGuild?.roleId ?? ticket.context.roleId;
    const memberId = realGuild?.memberId ?? ticket.context.linkedDiscordUserId;
    if (!memberId) throw new Error("The sandbox role fixture requires a linked Discord member.");
    const channelId = realGuild?.channelId ?? "810000000000000006";
    const botId = realGuild?.botId ?? "810000000000000004";
    const botRole = "810000000000000005";
    const otherRole = realGuild?.sentinelRoleId ?? "810000000000000007";
    const unrelatedMember = "810000000000000009";
    const secondRole = "810000000000000008";
    const roles = new Set([roleId, otherRole, secondRole]);
    const otherMemberRoles = new Set([roleId, otherRole]);
    const writes: string[] = [];
    const transport = createPartnerAlertManagedRoleTransport({
      botUserId: botId, forbiddenRoleIds: [otherRole, secondRole],
      readBinding: id => id === mappingId ? { mappingId, guildId, roleId, channelId, guildPermissions: "0", allowGrant: false } : null,
      createRest: scope => createPartnerAlertDiscordRoleRest({
        botUserId: botId, botToken: realGuild?.token ?? "synthetic_sandbox_discord_token", maximumDurationMs: realGuild ? 10_000 : 1000,
        transport: async (url, request) => {
          const path = new URL(url).pathname.replace("/api/v10", "");
          if (realGuild) {
            if (request.method !== "GET") {
              expect(request.method).toBe("DELETE");
              expect(path).toBe(`/guilds/${guildId}/members/${memberId}/roles/${roleId}`);
              writes.push(path);
            }
            return fetch(url, request);
          }
          if (path === "/users/@me") return Response.json({ id: botId, bot: true });
          if (path === `/guilds/${guildId}/roles`) return Response.json([
            { id: guildId, managed: false, permissions: "0", position: 0 },
            { id: roleId, managed: false, permissions: "0", position: 1 },
            { id: botRole, managed: false, permissions: String(1 << 28), position: 2 },
          ]);
          if (path === `/guilds/${guildId}/members/${botId}`) return Response.json({ user: { id: botId }, roles: [botRole] });
          if (path === `/guilds/${guildId}/channels`) return Response.json([{ id: channelId, guild_id: guildId, permission_overwrites: [] }]);
          expect(request.method).toBe("DELETE");
          expect(path).toBe(`/guilds/${guildId}/members/${memberId}/roles/${roleId}`);
          expect(path).not.toContain(unrelatedMember);
          writes.push(path);
          roles.delete(roleId);
          return new Response(null, { status: 204 });
        },
      }, scope),
    });
    const refs = new Map([late.invoice, won.dispute, lost.dispute, scheduled.subscription, immediate.subscription]
      .map(resourceId => [resourceId, randomUUID()]));
    const deliveredSecret = process.env.PARTNER_STRIPE_SIGNING_SECRET;
    if (process.env.PARTNER_STRIPE_REQUIRE_DELIVERY === "1") {
      expect(deliveredSecret).toMatch(/^whsec_/u);
      expect(Object.keys(capture.delivery ?? {})).toHaveLength(8);
    }
    const secret = deliveredSecret ?? `whsec_${randomBytes(32).toString("hex")}`;
    const now = Date.now();
    let alternatePurchase = false;
    const webhook = createPartnerAlertStripeSandboxWebhook({ db, signingSecret: secret, nowMs: () => now, transport,
      resolveVerifiedAssignment(event) {
        const resource = event.resource as SandboxResource;
        const assignmentRef = refs.get(resource.id);
        if (!assignmentRef || resource.livemode === true) return null;
        if (event.kind === "invoice.paid" && resource.parent?.subscription_details?.subscription !== late.subscription) return null;
        const dispute = [won, lost].find(item => item.dispute === resource.id);
        if (event.kind.startsWith("charge.dispute.") && (!dispute || resource.charge !== dispute.charge)) return null;
        return { environment: "sandbox", accountId: "stripe_test", eventId: event.id, eventHash: "sandbox",
          resourceKind: event.kind, resourceId: resource.id, userId, communityId, mappingId, sourceGuildId: guildId,
          sourceChannelId: channelId, guildId, channelId, roleId, discordUserId: memberId,
          assignmentRef, revision: 1, authorityKey: ticket.premium.scope.authorityKey,
          offerId: offers[0]!.offer.offerId, offerVersion: 1, offer: offers[0]!.offer };
      },
      canRemoveCurrentAssignment: () => !alternatePurchase,
    });
    const find = (kind: string, id: string, flag?: boolean) => {
      const found = events.find(event => event.type === kind && event.data.object.id === id
        && (flag === undefined || event.data.object.cancel_at_period_end === flag));
      expect(found).toBeDefined();
      expect(found?.livemode).toBe(false);
      return found!;
    };
    const send = (event: unknown, valid = true, native = false) => {
      if (native && process.env.PARTNER_STRIPE_REQUIRE_DELIVERY === "1") {
        const id = (event as {id: string}).id;
        const signed = capture.delivery?.[id];
        expect(signed).toBeDefined();
        return webhook.receive(new Request("http://127.0.0.1/stripe-sandbox", { method: "POST", body: signed!.raw,
          headers: { "stripe-signature": signed!.signature } }));
      }
      const raw = JSON.stringify(event);
      const time = Math.floor(now / 1000);
      const digest = createHmac("sha256", secret).update(`${time}.${raw}`).digest("hex");
      return webhook.receive(new Request("http://127.0.0.1/stripe-sandbox", { method: "POST", body: raw,
        headers: { "stripe-signature": `t=${time},v1=${valid ? digest : "0".repeat(64)}` } }));
    };
    const invoice = find("invoice.paid", late.invoice!);
    expect((await send(invoice, false)).status).toBe(400);
    expect((await send({ ...invoice, livemode: true })).status).toBe(400);
    for (const event of [invoice, find("customer.subscription.updated", scheduled.subscription!, true),
      find("charge.dispute.created", won.dispute!), find("charge.dispute.closed", won.dispute!),
      find("charge.dispute.created", lost.dispute!)]) {
      expect((await send(event, true, true)).status).toBe(202);
      expect(await webhook.approveRemoval(event.id, randomUUID())).toBe(false);
    }
    expect(writes).toEqual([]);
    await realGuild?.verify(true);
    for (const event of [find("customer.subscription.deleted", immediate.subscription!, false),
      find("customer.subscription.deleted", scheduled.subscription!, true), find("charge.dispute.closed", lost.dispute!)]) {
      roles.add(roleId);
      await realGuild?.prepare();
      const previous = writes.length;
      expect((await send(event, true, true)).status).toBe(202);
      expect(roles.has(roleId)).toBe(true);
      expect(await webhook.approveRemoval(event.id, randomUUID())).toBe(true);
      expect(writes).toHaveLength(previous + 1);
      if (realGuild) await realGuild.verify(false);
      else {
        expect([...roles].sort()).toEqual([otherRole, secondRole]);
        expect([...otherMemberRoles]).toEqual([roleId, otherRole]);
      }
      expect((await send(event, true, true)).status).toBe(200);
      expect(await webhook.approveRemoval(event.id, randomUUID())).toBe(false);
      expect(writes).toHaveLength(previous + 1);
    }
    // Re-present a candidate under a fresh isolated assignment, then protect it
    // with a second qualifying source before the owner tries to remove it.
    roles.add(roleId);
    await realGuild?.prepare();
    refs.set(immediate.subscription, randomUUID());
    alternatePurchase = true;
    const candidate = { ...find("customer.subscription.deleted", immediate.subscription!, false), id: "evt_QAAlternatePurchase" };
    expect((await send(candidate)).status).toBe(202);
    expect(await webhook.approveRemoval(candidate.id, randomUUID())).toBe(false);
    expect(roles.has(roleId)).toBe(true);
    expect(writes).toHaveLength(3);
    await realGuild?.verify(true);
  } finally {
    try { await realGuild?.cleanup(); }
    finally { db.close(); }
  }
}, 150_000);
