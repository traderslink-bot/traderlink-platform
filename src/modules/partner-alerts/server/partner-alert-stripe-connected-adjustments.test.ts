// @vitest-environment node
import Database from "better-sqlite3";
import { once } from "node:events";
import { createServer } from "node:http";
import { spawn } from "node:child_process";
import { randomUUID } from "node:crypto";
import { expect, it } from "vitest";
import { createPartnerAlertStripeDiscordTestGuild } from "./partner-alert-stripe-discord-test-guild";
import { createPartnerAlertManagedRoleTransport } from "./partner-alert-managed-role-transport";
import { createPartnerAlertDiscordRoleRest } from "./partner-alert-discord-role-rest";
import { createPartnerAlertStripeSandboxCheckout, createPartnerAlertStripeSandboxClient,
  createPartnerAlertStripeSandboxConnect } from "./partner-alert-stripe-checkout";

const key = process.env.PARTNER_STRIPE_CHECKOUT_TEST_KEY;
const account = process.env.PARTNER_STRIPE_CHECKOUT_SELLER_ACCOUNT;
const botToken = process.env.PARTNER_STRIPE_DISCORD_BOT_TOKEN;
const cli = process.env.PARTNER_STRIPE_CHECKOUT_CLI;

it.skipIf(!key || !account || !cli || !botToken)("reconciles Stripe Connect sandbox refunds, disputes, and a failed renewal", async () => {
  const connect = createPartnerAlertStripeSandboxConnect(key!);
  const stripe = connect.stripeForAccount(account!);
  const db = new Database(":memory:");
  const run = randomUUID();
  const received = new Map<string, { status: number; disposition?: string }>();
  const pendingOpenDisputes = new Map<string, { body: string; signature: string }>();
  const allowedResources = new Set<string>();
  let service: ReturnType<typeof createPartnerAlertStripeSandboxCheckout>;
  const server = createServer(async (incoming, outgoing) => {
    try {
      const buffers: Buffer[] = [];
      for await (const part of incoming) buffers.push(Buffer.from(part));
      const body = Buffer.concat(buffers).toString("utf8");
      const event = JSON.parse(body);
      const object = event.data.object;
      if (event.account === account && event.type === "charge.dispute.created" && !allowedResources.has(object.charge)) {
        pendingOpenDisputes.set(object.id, { body, signature: String(incoming.headers["stripe-signature"]) });
      }
      if (event.account !== account || ![object.id, object.charge, object.parent?.subscription_details?.subscription]
        .some(value => allowedResources.has(value))) {
        outgoing.writeHead(204).end();
        return;
      }
      const result = await service.invoiceWebhook(new Request(`http://127.0.0.1:${(server.address() as {port: number}).port}/webhook`, {
        method: "POST", headers: { "stripe-signature": String(incoming.headers["stripe-signature"]) }, body,
      }));
      const details = await result.json().catch(() => ({}));
      received.set(`${event.type}:${object.id}`, { status: result.status, ...details });
      outgoing.writeHead(result.status).end();
    } catch {
      outgoing.writeHead(500).end();
    }
  });
  await new Promise<void>(resolve => server.listen(0, "127.0.0.1", resolve));
  const origin = `http://127.0.0.1:${(server.address() as {port: number}).port}`;
  const listener = spawn(cli!, ["listen", "--skip-update", "--events",
    "charge.refunded,charge.dispute.created,charge.dispute.closed,invoice.payment_failed",
    "--forward-connect-to", `${origin}/webhook`],
  { env: { NODE_ENV: "test", PATH: process.env.PATH, STRIPE_API_KEY: key }, stdio: ["ignore", "pipe", "pipe"] });
  const clocks: string[] = [];
  let product: string | undefined;
  let price: string | undefined;
  const changes: string[][] = [];
  const permitted = new Set<string>();
  let discord: Awaited<ReturnType<typeof createPartnerAlertStripeDiscordTestGuild>> | undefined;
  const now = Math.floor(Date.now() / 1000);

  async function readEvent(kind: string, id: string, disposition: string) {
    await expect.poll(() => received.get(`${kind}:${id}`), { timeout: 45_000, interval: 750 })
      .toMatchObject({ status: 200, disposition });
    console.log(`${kind} → ${disposition}`);
  }

  try {
    const secret = await new Promise<string>((resolve, reject) => {
      const timer = setTimeout(() => reject(new Error("Stripe Connect listener unavailable.")), 15_000);
      const read = (part: Buffer) => {
        const secret = /whsec_[A-Za-z0-9]+/u.exec(part.toString())?.[0];
        if (secret) {
          clearTimeout(timer);
          resolve(secret);
        }
      };
      listener.stdout?.on("data", read);
      listener.stderr?.on("data", read);
      listener.once("exit", () => { clearTimeout(timer); reject(new Error("Stripe Connect listener exited.")); });
    });
    const fixture = await createPartnerAlertStripeDiscordTestGuild({
      guildId: process.env.PARTNER_STRIPE_DISCORD_GUILD_ID!,
      memberId: process.env.PARTNER_STRIPE_DISCORD_MEMBER_ID!,
      botToken: botToken!, managedRoleCount: 2,
    });
    discord = fixture;
    const roles = new Map([["opening", fixture.managedRoleIds[0]!], ["closing", fixture.managedRoleIds[1]!]]);
    const roleTransport = createPartnerAlertManagedRoleTransport({
      botUserId: fixture.botId, forbiddenRoleIds: [fixture.sentinelRoleId],
      readBinding(mappingId) {
        const roleId = roles.get(mappingId);
        return roleId ? { mappingId, guildId: fixture.guildId, roleId, channelId: fixture.channelId,
          guildPermissions: "0", allowGrant: true } : null;
      },
      createRest: scope => createPartnerAlertDiscordRoleRest({ botUserId: fixture.botId, botToken: fixture.token,
        maximumDurationMs: 10_000, transport: fetch }, scope),
    });
    async function setRole(mappingId: string, present: boolean, stillCurrent: () => boolean) {
      const result = await roleTransport.setRole({ mappingId, guildId: fixture.guildId, roleId: roles.get(mappingId)!,
        discordUserId: fixture.memberId, authorityKey: run, operationId: randomUUID(), present, stillCurrent });
      expect(result.kind).toBe("confirmed");
    }
    await setRole("opening", true, () => true);
    await setRole("closing", true, () => true);
    await fixture.verifyManagedRoles(fixture.managedRoleIds);
    service = createPartnerAlertStripeSandboxCheckout({ db, connect, stripe: createPartnerAlertStripeSandboxClient(key!),
      signingSecret: secret, returnOrigin: origin, nowMs: Date.now, readWhopAccess: () => "absent",
      authorizeCheckout: () => { throw new Error("The catalog checkout is exercised by the separate browser test."); },
      async reconcileAccess(_user, _community, check) {
        if (!check.ended) return;
        const candidates = ["opening", "closing"].filter(mapping => check.mayRemoveMapping(mapping));
        changes.push(candidates);
        for (const mapping of candidates) if (permitted.has(mapping)) {
          await setRole(mapping, false, () => permitted.has(mapping) && check.mayRemoveMapping(mapping));
        }
      },
    });
    product = String((await stripe("products", { name: `Connected adjustments QA ${run}` })).id);
    price = String((await stripe("prices", { product, currency: "usd", unit_amount: "2500", "recurring[interval]": "day" })).id);
    async function subscribe(name: string, mappings: string[], method: string, refundAfter?: boolean) {
      const clock = await stripe("test_helpers/test_clocks", { frozen_time: String(now), name: `${run}-${name}` });
      clocks.push(String(clock.id));
      const customer = await stripe("customers", { test_clock: String(clock.id), email: `${run}-${name}@example.invalid` });
      const subscription = await stripe("subscriptions", { customer: String(customer.id), collection_method: "send_invoice",
        days_until_due: "1", "items[0][price]": price!, "metadata[partner_sandbox_claim]": name });
      const invoiceId = String(subscription.latest_invoice);
      const open = await stripe(`invoices/${invoiceId}`);
      if (open.status === "draft") await stripe(`invoices/${invoiceId}/finalize`, {});
      const paymentMethod = await stripe(`payment_methods/${method}/attach`, { customer: String(customer.id) });
      await stripe(`invoices/${invoiceId}/pay`, { payment_method: String(paymentMethod.id) });
      const payments = await stripe(`invoice_payments?invoice=${invoiceId}&status=paid&limit=10`);
      const [payment] = payments.data as { id: string; payment: { payment_intent: string } }[];
      const intent = await stripe(`payment_intents/${payment!.payment.payment_intent}`);
      const charge = String(intent.latest_charge);
      // Seed the already-verified purchase ledger with the exact seller invoice
      // from this run. Hosted Checkout is covered by the catalog browser test.
      db.prepare(`INSERT INTO qa_partner_stripe_claims(claim_id,user_id,community_id,offer_id,offer_version,price_id,mappings,subscription_id,customer_id)
        VALUES(?,?,?, ?,1,?,?,?,?)`).run(name, "buyer", "community", name, price, JSON.stringify(mappings), subscription.id, customer.id);
      db.prepare("INSERT INTO qa_partner_stripe_claim_sellers VALUES(?,?)").run(name, account);
      db.prepare("INSERT INTO qa_partner_stripe_events VALUES(?,?)").run(`evt_seed_${name}`, run);
      db.prepare("INSERT INTO qa_partner_stripe_terms VALUES(?,?,?,?,?,?)")
        .run(invoiceId, name, payment!.id, payment!.payment.payment_intent, now, now + 86400);
      db.prepare("INSERT INTO qa_partner_stripe_settlements VALUES(?,?,?,?)").run(invoiceId, "usd", 2500, `evt_seed_${name}`);
      allowedResources.add(charge);
      allowedResources.add(String(subscription.id));
      if (refundAfter) expect(charge).toMatch(/^ch_/u);
      return { subscription, charge, clock, customer };
    }

    const bundle = await subscribe("bundle", ["opening", "closing"], "pm_card_visa", true);
    const single = await subscribe("single", ["opening"], "pm_card_visa");
    const failed = await stripe("payment_methods/pm_card_chargeCustomerFail/attach", { customer: String(single.customer.id) });
    await stripe(`test_helpers/test_clocks/${single.clock.id}/advance`, { frozen_time: String(now + 86430) });
    await expect.poll(async () => (await stripe(`test_helpers/test_clocks/${single.clock.id}`)).status,
      { timeout: 30_000, interval: 1000 }).toBe("ready");
    const renewed = await stripe(`subscriptions/${single.subscription.id}`);
    const renewalId = String(renewed.latest_invoice);
    expect(renewalId).not.toBe(String(single.subscription.latest_invoice));
    allowedResources.add(renewalId);
    const renewal = await stripe(`invoices/${renewalId}`);
    if (renewal.status === "draft") await stripe(`invoices/${renewalId}/finalize`, {});
    await expect(stripe(`invoices/${renewalId}/pay`, { payment_method: String(failed.id) })).rejects.toThrow();
    await readEvent("invoice.payment_failed", renewalId, "review");
    expect(changes).toEqual([]);
    expect(service.readOccupiedMappings("buyer", "community")).toEqual(["closing", "opening"]);
    await fixture.verifyManagedRoles(fixture.managedRoleIds);

    await stripe("refunds", { charge: bundle.charge, amount: "500" });
    await readEvent("charge.refunded", bundle.charge, "review");
    expect(changes).toEqual([]);
    await fixture.verifyManagedRoles(fixture.managedRoleIds);
    permitted.add("closing");
    await stripe("refunds", { charge: bundle.charge });
    await readEvent("charge.refunded", bundle.charge, "remove_candidate");
    expect(changes).toEqual([["closing"]]);
    await fixture.verifyManagedRoles([fixture.roleId]);

    const disputed = await subscribe("dispute", ["closing"], "pm_card_createDisputeProductNotReceived");
    const [dispute] = (await stripe(`disputes?charge=${disputed.charge}`)).data as { id: string }[];
    expect(dispute?.id).toMatch(/^d[up]_/u);
    allowedResources.add(dispute!.id);
    const captured = pendingOpenDisputes.get(dispute!.id);
    if (captured) await fetch(`${origin}/webhook`, {
      method: "POST", body: captured.body, headers: { "stripe-signature": captured.signature },
    });
    await readEvent("charge.dispute.created", dispute!.id, "review");
    expect(changes).toEqual([["closing"]]);
    await setRole("closing", true, () => service.readOccupiedMappings("buyer", "community").includes("closing"));
    await fixture.verifyManagedRoles(fixture.managedRoleIds);
    const def = await stripe(`disputes/${dispute!.id}/close`, {});
    expect(def.status).toBe("lost");
    await readEvent("charge.dispute.closed", dispute!.id, "remove_candidate");
    expect(changes).toEqual([["closing"], ["closing"]]);
    await fixture.verifyManagedRoles([fixture.roleId]);
    expect(service.readOccupiedMappings("buyer", "community")).toEqual(["opening"]);
  } finally {
    await discord?.cleanup();
    listener.kill();
    server.close();
    if (listener.exitCode === null && listener.signalCode === null) await once(listener, "exit").catch(() => {});
    for (const clock of clocks) await fetch(`https://api.stripe.com/v1/test_helpers/test_clocks/${clock}`, {
      method: "DELETE", headers: { Authorization: `Bearer ${key}`, "Stripe-Account": account! },
    }).then(response => response.body?.cancel());
    if (price) await stripe(`prices/${price}`, { active: "false" });
    if (product) await stripe(`products/${product}`, { active: "false" });
    db.close();
  }
}, 160_000);
