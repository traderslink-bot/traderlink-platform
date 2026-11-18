// @vitest-environment node
import { NextRequest } from "next/server";
import { randomUUID } from "node:crypto";
import { spawn, type ChildProcess } from "node:child_process";
import { mkdtempSync, rmSync, readFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { createServer } from "node:http";
import { POST as checkoutRoute } from "@/app/api/partner-channels/communities/[communityId]/offers/[offerKey]/checkout/route";
import { POST as webhookRoute } from "@/app/api/partner-channels/stripe-sandbox/webhook/route";
import { chromium, type Page } from "playwright";
import { expect, it } from "vitest";
import { openPartnerAlertStripeSandboxLedger } from "./partner-alert-stripe-billing-store";
import { bindPartnerAlertStripeSandbox } from "./partner-alert-stripe-sandbox-runtime";
import { createPartnerAlertStripeDiscordTestGuild } from "./partner-alert-stripe-discord-test-guild";
import { createPartnerAlertManagedRoleTransport } from "./partner-alert-managed-role-transport";
import { createPartnerAlertDiscordRoleRest } from "./partner-alert-discord-role-rest";
import { createPartnerAlertStripeOnboarding } from "./partner-alert-stripe-onboarding";
import { qualifiedPaidInput } from "../contracts/partner-alert-access-policy.test-fixture";
import { createPartnerAlertStripeSandboxCheckout, createPartnerAlertStripeSandboxClient, createPartnerAlertStripeSandboxConnect } from "./partner-alert-stripe-checkout";

const testKey = process.env.PARTNER_STRIPE_CHECKOUT_TEST_KEY;
const sellerAccount = process.env.PARTNER_STRIPE_CHECKOUT_SELLER_ACCOUNT;
const onboardingLedger = process.env.PARTNER_STRIPE_CHECKOUT_ONBOARDING_LEDGER;
const simulateSellerReadiness = process.env.PARTNER_STRIPE_QA_SIMULATE_SELLER_READINESS === "1";
const stripeCli = process.env.PARTNER_STRIPE_CHECKOUT_CLI;
const discordToken = process.env.PARTNER_STRIPE_DISCORD_BOT_TOKEN;
const previewScript = process.env.PARTNER_STRIPE_CATALOG_PREVIEW_SCRIPT;
const webhookPath = "/api/partner-channels/stripe-sandbox/webhook";

function signingSecret(listener: ChildProcess): Promise<string> {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error("Stripe CLI listener was unavailable.")), 20_000);
    const receive = (chunk: Buffer) => {
      const found = /whsec_[A-Za-z0-9]+/u.exec(chunk.toString())?.[0];
      if (found) {
        clearTimeout(timer);
        resolve(found);
      }
    };
    listener.stdout?.on("data", receive);
    listener.stderr?.on("data", receive);
    listener.once("error", () => { clearTimeout(timer); reject(new Error("Could not launch the Stripe CLI.")); });
    listener.once("exit", () => { clearTimeout(timer); reject(new Error("Stripe CLI listener exited.")); });
  });
}

async function fillCheckout(page: Page, email: string, card = "4242424242424242") {
  async function frameFor(selector: string) {
    let frame: ReturnType<Page["mainFrame"]> | undefined;
    await expect.poll(async () => {
      for (const candidate of page.frames()) {
        if (await candidate.locator(selector).first().isVisible().catch(() => false)) {
          frame = candidate;
          return true;
        }
      }
      return false;
    }, { timeout: 18_000, interval: 500 }).toBe(true);
    return frame!;
  }
  const emailSelector = "#linkAuthentication-emailInput, #email, input[type=email]";
  const contact = await frameFor(emailSelector);
  await contact.locator(emailSelector).first().fill(email);
  for (const candidate of page.frames()) {
    const cardOption = candidate.getByText("Card", { exact: true }).first();
    if (await cardOption.isVisible().catch(() => false)) {
      await cardOption.click({ timeout: 1500 }).catch(() => {});
      break;
    }
  }
  const numberSelector = "#payment-numberInput, #cardNumber, input[autocomplete=cc-number]";
  const form = await frameFor(numberSelector);
  await form.locator(numberSelector).first().fill(card);
  await form.locator("#payment-expiryInput, #cardExpiry, input[autocomplete=cc-exp]").first().fill("1235");
  await form.locator("#payment-cvcInput, #cardCvc, input[autocomplete=cc-csc]").first().fill("123");
  const name = form.locator("#payment-nameInput, #billingName, input[autocomplete=cc-name]").first();
  if (await name.isVisible()) await name.fill("Partner Channels QA");
  const postalCode = form.locator("#payment-postalCodeInput, #billingPostalCode, input[autocomplete=cc-postal-code], input[autocomplete=postal-code]").first();
  if (await postalCode.isVisible()) await postalCode.fill("12345");
  for (const candidate of page.frames()) {
    const saveForLink = candidate.locator("#payment-linkOptInInput");
    if (await saveForLink.isVisible() && await saveForLink.isChecked()) await saveForLink.uncheck();
    const subscribe = candidate.getByRole("button", { name: /subscribe/i }).last();
    if (await subscribe.isVisible()) {
      await subscribe.click();
      return;
    }
  }
  await form.locator("button[type=submit]").last().click();
}

it.skipIf(!testKey || !stripeCli || !discordToken)("completes Stripe channel and package checkout and reconciles Discord roles on the real test guild", async () => {
  const platformStripe = createPartnerAlertStripeSandboxClient(testKey!);
  const providerConnect = sellerAccount ? createPartnerAlertStripeSandboxConnect(testKey!) : undefined;
  const connect = providerConnect && simulateSellerReadiness ? {
    ...providerConnect,
    async readSeller(accountId: string) {
      const seller = await providerConnect.readSeller(accountId);
      expect(seller.id).toBe(sellerAccount);
      expect(seller.livemode).toBe(false);
      // Exercise real sandbox checkout and delivery while simulating only the
      // two capability flags that normally follow seller onboarding.
      return { ...seller, configuration: { merchant: { capabilities: {
        card_payments: { status: "active" }, stripe_balance: { payouts: { status: "active" } },
      } } } };
    },
  } : providerConnect;
  if (simulateSellerReadiness) console.log("Sandbox onboarding readiness simulated for this browser test only.");
  const stripe = sellerAccount && connect ? connect.stripeForAccount(sellerAccount) : platformStripe;
  const run = randomUUID();
  const ledgerDirectory = mkdtempSync("/tmp/traderlink-paid-qa-");
  const db = openPartnerAlertStripeSandboxLedger(ledgerDirectory);
  const deliveries = new Map<string, { raw: string; signature: string; status: number }>();
  const { userId: fixtureUserId, communityId: fixtureCommunityId, offers, ticket } = qualifiedPaidInput();
  const previewState = previewScript ? dirname(previewScript) : undefined;
  const manifest = previewState ? JSON.parse(readFileSync(join(previewState, "paid-owner-preview.json"), "utf8")) as {
    users: {trader: {userId: string; token: string}; owner: {userId: string}}; community: {id: string};
  } : undefined;
  const userId = manifest?.users.trader.userId ?? fixtureUserId;
  const communityId = manifest?.community.id ?? fixtureCommunityId;
  const ownerId = manifest?.users.owner.userId ?? "sandbox-community-owner";
  const sellerLedger = onboardingLedger ? openPartnerAlertStripeSandboxLedger(onboardingLedger) : db;
  const onboarding = createPartnerAlertStripeOnboarding(sellerLedger, async () => { throw new Error("Read-only seller binding fixture."); });
  if (onboardingLedger) {
    expect(onboarding.sellerAccount(communityId, ownerId)).toBe(sellerAccount);
  } else if (sellerAccount) {
    db.prepare("INSERT INTO qa_partner_stripe_sellers VALUES(?,?,?,?,?)").run(communityId, ownerId, randomUUID(), "US", sellerAccount);
  }
  const channel = { ...offers[0]!.offer, communityId, cadence: { unit: "day" as const, count: 1 } };
  const pack = { ...channel, kind: "package" as const, offerId: "33333333-3333-4333-8333-333333333339",
    mappingIds: [...channel.mappingIds, "33333333-3333-4333-8333-333333333340"] };
  const subscriptions = new Set<string>();
  const product = await stripe("products", { name: `Partner Channels test ${run}` });
  const priceIds: string[] = [];
  let application: ReturnType<typeof createPartnerAlertStripeSandboxCheckout>;
  const server = createServer(async (incoming, outgoing) => {
    try {
      const path = incoming.url ?? "/";
      if (path === "/__stripe-catalog-state" && incoming.headers["x-partner-qa-session"] === run) {
        const active = [channel, pack].filter(offer => offer.mappingIds.every(id => occupied.has(id))).map(offer => `${offer.offerId}:1`);
        outgoing.writeHead(200, { "content-type": "application/json" }); outgoing.end(JSON.stringify(active)); return;
      }
      if (path === "/partner-channels") { outgoing.end("Partner Channels test checkout return"); return; }
      const parts = path.split("/");
      const headers = new Headers(Object.entries(incoming.headers).flatMap(([name, value]) => typeof value === "string" ? [[name, value] as [string, string]] : []));
      if (incoming.method !== "POST") { outgoing.writeHead(405); outgoing.end(); return; }
      const buffers: Buffer[] = [];
      for await (const chunk of incoming) buffers.push(Buffer.from(chunk));
      const request = new NextRequest(`${origin}${path}`, { method: incoming.method, headers,
        ...(buffers.length ? { body: new Uint8Array(Buffer.concat(buffers)) } : {}) });
      let result: Response;
      if (path === webhookPath) {
        const raw = Buffer.concat(buffers).toString("utf8");
        const event = JSON.parse(raw) as { data: { object: {id: string;
          metadata?: {partner_sandbox_claim?: string};
          parent?: {subscription_details?: {metadata?: {partner_sandbox_claim?: string}}}} } };
        const invoice = event.data.object;
        const claim = invoice.parent?.subscription_details?.metadata?.partner_sandbox_claim ?? invoice.metadata?.partner_sandbox_claim;
        if (!claim || !db.prepare("SELECT 1 FROM qa_partner_stripe_claims WHERE claim_id=?").get(claim)) {
          outgoing.writeHead(204); outgoing.end(); return;
        }
        result = await webhookRoute(request);
        deliveries.set(invoice.id, { raw, signature: headers.get("stripe-signature") ?? "", status: result.status });
      } else {
        result = await checkoutRoute(request, { params: Promise.resolve({ communityId: decodeURIComponent(parts[4] ?? ""),
          offerKey: decodeURIComponent(parts[6] ?? "") }) });
      }
      outgoing.writeHead(result.status, { "content-type": "application/json" }); outgoing.end(await result.text());
    } catch { outgoing.writeHead(500); outgoing.end(); }
  });
  await new Promise<void>(resolve => server.listen(0, "127.0.0.1", resolve));
  const address = server.address();
  if (!address || typeof address !== "object") throw new Error("Missing loopback listener.");
  const backendOrigin = `http://127.0.0.1:${address.port}`;
  const origin = previewScript ? "http://127.0.0.1:3039" : backendOrigin;
  let browser: Awaited<ReturnType<typeof chromium.launch>> | undefined;
  let listener: ChildProcess | undefined;
  let preview: ChildProcess | undefined;
  let unbind: (() => void) | undefined;
  let discord: Awaited<ReturnType<typeof createPartnerAlertStripeDiscordTestGuild>> | undefined;
  const occupied = new Set<string>();
  const roleWrites: {method: string; mappingId: string}[] = [];
  async function cancel(subscriptionId: string) {
    const result = await fetch(`https://api.stripe.com/v1/subscriptions/${subscriptionId}`, { method: "DELETE",
      headers: { Authorization: `Bearer ${testKey}`, "Stripe-Version": "2026-10-28.endive",
        ...(sellerAccount ? { "Stripe-Account": sellerAccount } : {}) }, redirect: "error" });
    expect(result.ok).toBe(true);
    await result.body?.cancel();
  }
  try {
    discord = await createPartnerAlertStripeDiscordTestGuild({
      guildId: process.env.PARTNER_STRIPE_DISCORD_GUILD_ID ?? "",
      memberId: process.env.PARTNER_STRIPE_DISCORD_MEMBER_ID ?? "",
      botToken: discordToken!, managedRoleCount: 2,
    });
    const fixture = discord;
    const roleByMapping = new Map(pack.mappingIds.map((mappingId, index) => [mappingId, fixture.managedRoleIds[index]!]));
    const transport = createPartnerAlertManagedRoleTransport({
      botUserId: fixture.botId, forbiddenRoleIds: [fixture.sentinelRoleId],
      readBinding(mappingId) {
        const roleId = roleByMapping.get(mappingId);
        return roleId ? { mappingId, guildId: fixture.guildId, roleId, channelId: fixture.channelId,
          guildPermissions: "0", allowGrant: true } : null;
      },
      createRest: scope => createPartnerAlertDiscordRoleRest({ botUserId: fixture.botId, botToken: fixture.token,
        maximumDurationMs: 10_000, transport: async (url, request) => {
          if (request.method !== "GET") {
            const roleId = new URL(url).pathname.split("/").at(-1);
            const mappingId = [...roleByMapping].find(([, role]) => role === roleId)?.[0];
            expect(mappingId).toBeDefined();
            expect(new URL(url).pathname).toBe(`/api/v10/guilds/${fixture.guildId}/members/${fixture.memberId}/roles/${roleId}`);
            roleWrites.push({method: request.method!, mappingId: mappingId!});
          }
          return fetch(url, request);
        } }, scope),
    });
    let mutex = Promise.resolve();
    const approveRemoval = new Set<string>();
    listener = spawn(stripeCli!, ["listen", "--skip-update", "--events", "invoice.paid,customer.subscription.deleted", sellerAccount ? "--forward-connect-to" : "--forward-to", `${origin}${webhookPath}`],
      { env: { NODE_ENV: "test", PATH: process.env.PATH, STRIPE_API_KEY: testKey }, stdio: ["ignore", "pipe", "pipe"] });
    const secret = await signingSecret(listener);
    browser = await chromium.launch({ headless: true });
    for (const offer of [channel, pack]) {
      const price = await stripe("prices", { product: String(product.id), currency: "usd",
        unit_amount: String(offer.amountMinor), "recurring[interval]": "day" });
      priceIds.push(String(price.id));
    }
    application = createPartnerAlertStripeSandboxCheckout({ db, stripe: platformStripe, connect, signingSecret: secret, returnOrigin: origin, nowMs: Date.now,
      readWhopAccess: () => "absent",
      reconcileAccess(buyerId, selectedCommunityId, evidence) {
        const work = mutex.then(async () => {
          expect(buyerId).toBe(userId);
          expect(selectedCommunityId).toBe(communityId);
          for (const [mappingId, roleId] of roleByMapping) {
            const wanted = evidence.readOccupiedMappings().includes(mappingId);
            if (occupied.has(mappingId) === wanted || (!wanted && (!approveRemoval.has(mappingId) || !evidence.mayRemoveMapping(mappingId)))) continue;
            const result = await transport.setRole({ mappingId, guildId: fixture.guildId, roleId,
              discordUserId: fixture.memberId, authorityKey: ticket.premium.scope.authorityKey, operationId: randomUUID(),
              present: wanted, stillCurrent: () => wanted
                ? evidence.readOccupiedMappings().includes(mappingId)
                : approveRemoval.has(mappingId) && evidence.mayRemoveMapping(mappingId) });
            if (result.kind !== "confirmed" || result.present !== wanted || result.roleId !== roleId) throw new Error("Role change unconfirmed.");
            if (wanted) occupied.add(mappingId);
            else occupied.delete(mappingId);
          }
          await fixture.verifyManagedRoles([...occupied].map(id => roleByMapping.get(id)!));
        });
        mutex = work.catch(() => {});
        return work;
      },
      authorizeCheckout(request, selectedCommunityId, offerKey) {
        const signedIn = manifest
          ? (request.headers.get("cookie") ?? "").split(";").some(part => part.trim() === `tl_platform_session=${manifest.users.trader.token}`)
          : request.headers.get("x-partner-qa-session") === run;
        if (!signedIn || selectedCommunityId !== communityId) throw new Error("No sandbox session.");
        const index = [channel, pack].findIndex(offer => offerKey === `${offer.offerId}:1`);
        if (index < 0) throw new Error("Unknown sandbox offer");
        return { buyer: { userId, paidPremium: true, hasExistingWhopPurchase: false },
          target: { offer: [channel, pack][index]!, priceId: priceIds[index]!, sellerAccount: onboarding.sellerAccount(communityId, ownerId) ?? undefined } };
      },
    });
    unbind = bindPartnerAlertStripeSandbox({ origin, service: application, canOfferCheckout:
      (buyer, community, offerKey) => buyer === userId && community === communityId && [channel, pack].some(offer => offerKey === `${offer.offerId}:1`) });
    if (previewScript && previewState) {
      const items = [channel, pack].map((offer, index) => ({
        communityId, offerKey: `${offer.offerId}:1`, communityName: "Northstar Trading",
        channels: index === 0 ? ["Opening alerts"] : ["Opening alerts", "Closing alerts"],
        price: "$25.00", cadence: "day", access: "available", checkoutHref: null,
      }));
      preview = spawn(process.execPath, [previewScript, "--runtime"], { stdio: ["ignore", "pipe", "pipe"], env: {
        PATH: process.env.PATH, HOME: process.env.HOME, NODE_ENV: "development", NODE_OPTIONS: "--max-old-space-size=2600",
        NEXT_TELEMETRY_DISABLED: "1", NEXT_FONT_GOOGLE_MOCKED_RESPONSES: join(previewState, "offline-fonts.cjs"),
        TRADERLINK_PAID_OWNER_PREVIEW: "1", TRADERLINK_PLATFORM_DB_PATH: join(previewState, "traderlink-platform.sqlite"),
        PARTNER_ALERT_REQUEST_RUNTIME_ENABLED: "false", PARTNER_ALERT_CATALOG_CHECKOUT_ENABLED: "false",
        DISCORD_REDIRECT_URI: `${origin}/api/auth/discord/callback`, TRADERLINK_PLATFORM_PUBLIC_ORIGIN: origin,
        PORT: "3039", HOSTNAME: "127.0.0.1", PAID_STRIPE_CATALOG_BACKEND: backendOrigin,
        PAID_STRIPE_CATALOG_ITEMS: JSON.stringify(items), PAID_STRIPE_CATALOG_BRIDGE_KEY: run,
      } });
      preview.stdout?.on("data", chunk => console.log(String(chunk).trim()));
      preview.stderr?.on("data", chunk => console.log(String(chunk).trim()));
      await expect.poll(async () => {
        if (preview?.exitCode !== null) return -1;
        return fetch(`${origin}/__paid-preview`).then(response => response.status).catch(() => 0);
      }, { timeout: 40_000, interval: 1000 }).toBe(200);
    }
    const urls = [];
    if (!previewScript) for (const offer of [channel, pack]) {
      const response = await fetch(`${origin}/api/partner-channels/communities/${communityId}/offers/${offer.offerId}:1/checkout`, { method: "POST",
        headers: { origin, "x-partner-qa-session": run } });
      expect(response.status).toBe(200);
      urls.push((await response.json()).url as string);
      console.log(`Stripe sandbox ${offer.kind} Checkout Session created`);
    }
    for (const [index, offer] of [channel, pack].entries()) {
      const url = urls[index];
      const context = await browser.newContext({ locale: "en-US" });
      try {
        const page = await context.newPage();
        page.setDefaultTimeout(25_000);
        if (previewScript) {
          const loaded = await page.goto(`${origin}/__paid-preview/trader`, { waitUntil: "domcontentloaded", timeout: 80_000 });
          expect(loaded?.status()).toBe(200);
          expect(new URL(page.url()).pathname).toBe("/partner-channels");
          await expect.poll(() => page.getByRole("button", {name: "View channels"}).count(), { timeout: 8_000 }).toBe(2).catch(async error => {
            console.log("Catalog browser", (await page.locator("body").innerText()).slice(-1900));
            throw error;
          });
          const consent = page.getByRole("button", {name: "Reject optional"});
          await consent.waitFor({state: "visible", timeout: 15_000});
          await expect.poll(async () => {
            if (await consent.isVisible()) await consent.click();
            return !await consent.isVisible();
          }, {timeout: 12_000, interval: 700}).toBe(true);
          const stripeButton = page.getByRole("button", {name: "Continue to Stripe"});
          await expect.poll(async () => {
            if (await stripeButton.isVisible()) return true;
            if (await page.getByRole("dialog").count() === 0) await page.getByRole("button", {name: "View channels"}).nth(index).click();
            return stripeButton.isVisible();
          }, { timeout: 12_000, interval: 600 }).toBe(true).catch(async error => {
            console.log("Catalog dialog", (await page.locator("body").innerText()).slice(-1700));
            throw error;
          });
          await stripeButton.click();
          await page.waitForURL("https://checkout.stripe.com/**", { timeout: 30_000, waitUntil: "domcontentloaded" }).catch(async error => {
            console.log("Catalog checkout handoff", (await page.locator("body").innerText()).slice(-1500));
            throw error;
          });
          console.log(`TraderLink catalog browser opened Stripe for ${offer.kind}`);
        } else {
          await page.goto(url!, { waitUntil: "domcontentloaded" });
        }
        await fillCheckout(page, `partner-qa-${index}-${run}@example.invalid`).catch(async error => {
          const frames = await Promise.all(page.frames().map(async frame => ({
            host: frame.url() ? new URL(frame.url()).hostname : "",
            inputs: await frame.locator("input").evaluateAll(items => items.map(item => ({ id: item.id, type: item.getAttribute("type") }))).catch(() => []),
          })));
          console.log("Sandbox Checkout form diagnostics", JSON.stringify(frames));
          throw error;
        });
        const claim = db.prepare("SELECT session_id FROM qa_partner_stripe_claims WHERE offer_id=?").pluck().get(offer.offerId);
        await expect.poll(async () => {
          const session = await stripe(`checkout/sessions/${claim}`);
          if (typeof session.subscription === "string") subscriptions.add(session.subscription);
          return session.status;
        }, { timeout: 15_000, interval: 1500 }).toBe("complete").catch(async error => {
          for (const frame of page.frames()) {
            const message = await frame.locator("[role=alert], [aria-live=polite]").allTextContents().catch(() => []);
            if (message.some(Boolean)) console.log("Sandbox Checkout status", message.filter(Boolean).join(" ").slice(0, 250));
          }
          const status = await page.frames().find(frame => frame.url().includes("js.stripe.com") && frame.url().includes("checkout"))
            ?.locator("body").innerText().catch(() => "");
          if (status) console.log("Sandbox Checkout form status", status.slice(0, 500));
          throw error;
        });
        const subscription = await stripe(`subscriptions/${[...subscriptions].at(-1)}`);
        const invoiceId = subscription.latest_invoice;
        await expect.poll(() => deliveries.get(String(invoiceId))?.status, { timeout: 30_000, interval: 500 }).toBe(200);
        const delivery = deliveries.get(String(invoiceId))!;
        expect(delivery.signature).toContain("v1=");
        if (sellerAccount) {
          expect(JSON.parse(delivery.raw).account).toBe(sellerAccount);
          expect(subscription.application_fee_percent).toBeNull();
          expect(subscription.transfer_data).toBeNull();
        }
        expect((await fetch(`${origin}${webhookPath}`, { method: "POST", body: delivery.raw,
          headers: { "stripe-signature": delivery.signature } })).status).toBe(200);
        expect(db.prepare("SELECT count(*) FROM qa_partner_stripe_terms").pluck().get()).toBe(index + 1);
        expect([...occupied].sort()).toEqual([...offer.mappingIds].sort());
        expect(roleWrites).toHaveLength(index + 1);
        if (previewScript) {
          await page.waitForURL(`${origin}/partner-channels`, { timeout: 25_000 });
          await page.reload({ waitUntil: "domcontentloaded", timeout: 30_000 });
          await expect.poll(() => page.locator(".MuiChip-label").filter({ hasText: /^Subscribed$/u }).count(), { timeout: 10_000 }).toBe(index + 1);
        }
        console.log(`Stripe sandbox ${offer.kind} checkout, invoice, verified role grant and duplicate replay passed`);
      } finally { await context.close(); }
    }
    const [single, bundle] = [...subscriptions];
    for (const [subscriptionId, expectedRemoval] of [[bundle!, pack.mappingIds[1]!], [single!, channel.mappingIds[0]!]]) {
      approveRemoval.clear();
      approveRemoval.add(expectedRemoval);
      const previous = roleWrites.length;
      await cancel(subscriptionId);
      subscriptions.delete(subscriptionId);
      await expect.poll(() => deliveries.get(subscriptionId)?.status, {timeout: 30_000, interval: 500}).toBe(200);
      expect(roleWrites.slice(previous)).toEqual([{method: "DELETE", mappingId: expectedRemoval}]);
      const ending = deliveries.get(subscriptionId)!;
      expect((await fetch(`${origin}${webhookPath}`, { method: "POST", body: ending.raw,
        headers: { "stripe-signature": ending.signature } })).status).toBe(200);
      expect(roleWrites).toHaveLength(previous + 1);
      await fixture.verifyManagedRoles(subscriptionId === bundle ? [fixture.roleId] : []);
      if (previewScript) {
        const review = await browser.newContext();
        try {
          const page = await review.newPage();
          const loaded = await page.goto(`${origin}/__paid-preview/trader`, { waitUntil: "domcontentloaded" });
          expect(loaded?.status()).toBe(200);
          const subscribers = page.locator(".MuiChip-label").filter({hasText: /^Subscribed$/u});
          await expect.poll(() => subscribers.count(), {timeout: 10_000}).toBe(subscriptionId === bundle ? 1 : 0);
        } finally { await review.close(); }
      }
      console.log(subscriptionId === bundle ? "Package ending removed only the package-only Discord role" : "Channel ending removed only its remaining Discord role");
    }
    const mappings = db.prepare("SELECT offer_id,mappings FROM qa_partner_stripe_claims").all();
    expect(mappings).toHaveLength(2);
    expect(mappings).toEqual(expect.arrayContaining([channel, pack].map(offer => ({
      offer_id: offer.offerId, mappings: JSON.stringify(offer.mappingIds),
    }))));
  } finally {
    await browser?.close();
    preview?.kill();
    await discord?.cleanup();
    unbind?.();
    listener?.kill();
    server.close();
    const ids = db.prepare("SELECT session_id FROM qa_partner_stripe_claims WHERE session_id IS NOT NULL").pluck().all();
    for (const sessionId of ids) {
      const session = await stripe(`checkout/sessions/${sessionId}`);
      if (session.status === "open") await stripe(`checkout/sessions/${sessionId}/expire`, {});
      if (typeof session.subscription === "string") subscriptions.add(session.subscription);
    }
    // Exact disposable subscriptions and prices only.
    for (const subscription of subscriptions) {
      if ((await stripe(`subscriptions/${subscription}`)).status !== "canceled") await cancel(subscription);
    }
    for (const price of priceIds) await stripe(`prices/${price}`, { active: "false" });
    await stripe(`products/${product.id}`, { active: "false" });
    if (sellerLedger !== db) sellerLedger.close();
    db.close();
    rmSync(ledgerDirectory, { recursive: true, force: true });
  }
}, 330_000);
