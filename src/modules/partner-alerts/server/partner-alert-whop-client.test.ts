import { describe, expect, it } from "vitest";
import { PartnerAlertWhopReadClient, type PartnerAlertWhopTransport } from "./partner-alert-whop-client";

function client(transport: PartnerAlertWhopTransport) {
  return new PartnerAlertWhopReadClient({ environment: "sandbox", apiVersionDate: "2026-10-27-2",
    accountId: "biz_qa", bearerToken: "unit_fixture_read_key" }, transport);
}
const page = (data: unknown[], hasNext = false, cursor: string | null = null) =>
  Response.json({ data, page_info: { has_next_page: hasNext, end_cursor: cursor } });

describe("scoped read-only Whop adjustment reads", () => {
  it.each(["refunds", "disputes"] as const)("keeps %s lookup on the exact sandbox account and payment", async kind => {
    const requests: URL[] = [];
    const c = client(async (url, init) => {
      requests.push(new URL(url)); expect(init.method).toBe("GET"); expect(init.redirect).toBe("manual");
      expect(new Headers(init.headers).get("Api-Version-Date")).toBe("2026-10-27-2");
      return page([]);
    });
    const result = kind === "refunds" ? await c.listPaymentRefunds({ paymentId: "pay_qa" })
      : await c.listPaymentDisputes({ paymentId: "pay_qa" });
    expect(result).toEqual({ items: [], hasNextPage: false, endCursor: null });
    expect(requests).toHaveLength(1);
    expect(requests[0].origin).toBe("https://sandbox-api.whop.com");
    expect(requests[0].pathname).toBe(`/api/v1/${kind}`);
    expect(requests[0].searchParams.get("account_id")).toBe("biz_qa");
    expect(requests[0].searchParams.get(kind === "refunds" ? "payment_id" : "query")).toBe("pay_qa");
    if (kind === "disputes") {
      expect(requests[0].searchParams.has("payment_id")).toBe(false);
      expect(requests[0].searchParams.get("include_subaccounts")).toBe("false");
    }
  });

  it("projects dispute references without card or contact fields", async () => {
    const c = client(async () => page([{ id: "dp_qa", account_id: "biz_qa", status: "needs_response",
      payment: { id: "pay_qa", card_last4: "4242", customer_email: "fixture@example.invalid" },
      evidence: { private: "not_returned" } }]));
    const result = await c.listPaymentDisputes({ paymentId: "pay_qa" });
    expect(result.items).toEqual([{ id: "dp_qa", accountId: "biz_qa", paymentId: "pay_qa", status: "needs_response" }]);
    expect(JSON.stringify(result)).not.toMatch(/4242|customer_email|evidence|not_returned/);
  });

  it("uses the native refund payment_id relationship", async () => {
    const c = client(async () => page([{ id: "rf_qa", account_id: "biz_qa", payment_id: "pay_qa", status: "failed" }]));
    expect((await c.listPaymentRefunds({ paymentId: "pay_qa" })).items[0]).toEqual({
      id: "rf_qa", accountId: "biz_qa", paymentId: "pay_qa", status: "failed",
    });
  });

  it.each([401, 403])( "never reports a denied dispute read as an empty successful result (%s)", async status => {
    const c = client(async () => Response.json({ error: { message: "Read scope missing" } }, { status }));
    await expect(c.listPaymentDisputes({ paymentId: "pay_qa" })).rejects.toMatchObject({ kind: "authorisation" });
  });

  it.each(["refunds", "disputes"] as const)("refuses another account in %s results", async kind => {
    const c = client(async () => page([{ id: "adjust_qa", account_id: "biz_foreign", status: "failed",
      payment_id: "pay_qa", payment: { id: "pay_qa" } }]));
    await expect(kind === "refunds" ? c.listPaymentRefunds({ paymentId: "pay_qa" })
      : c.listPaymentDisputes({ paymentId: "pay_qa" })).rejects.toMatchObject({ kind: "scope" });
  });

  it.each(["refunds", "disputes"] as const)("refuses an unrelated payment in %s results", async kind => {
    const c = client(async () => page([{ id: "adjust_qa", account_id: "biz_qa", status: "failed",
      payment_id: "pay_other", payment: { id: "pay_other" } }]));
    await expect(kind === "refunds" ? c.listPaymentRefunds({ paymentId: "pay_qa" })
      : c.listPaymentDisputes({ paymentId: "pay_qa" })).rejects.toMatchObject({ kind: "scope" });
  });

  it("refuses repeated adjustment identifiers", async () => {
    const item = { id: "rf_qa", account_id: "biz_qa", payment_id: "pay_qa", status: "failed" };
    const c = client(async () => page([item, item]));
    await expect(c.listPaymentRefunds({ paymentId: "pay_qa" })).rejects.toMatchObject({ kind: "shape" });
  });

  it.each([null, "same_cursor"])("refuses an unfinished page without a progressing cursor (%s)", async cursor => {
    const c = client(async () => page([], true, cursor));
    await expect(c.listPaymentDisputes({ paymentId: "pay_qa", after: "same_cursor" }))
      .rejects.toMatchObject({ kind: "shape" });
  });

  it("does not silently deduplicate a payment discovery page", async () => {
    const item = { id: "pay_qa", account_id: "biz_qa", membership_id: "mem_qa", user: { id: "user_qa" } };
    const c = client(async () => page([item, item]));
    await expect(c.listMembershipPayments({ membershipId: "mem_qa", whopUserId: "user_qa" }))
      .rejects.toMatchObject({ kind: "shape" });
  });

  it("accepts an external cancellation before any adjustment HTTP request", async () => {
    let requests = 0;
    const c = client(async () => { requests++; return page([]); });
    const controller = new AbortController(); controller.abort();
    await expect(c.listPaymentDisputes({ paymentId: "pay_qa" }, controller.signal)).rejects.toMatchObject({ kind: "unavailable" });
    expect(requests).toBe(0);
  });

  it("accepts cancellation before payment discovery", async () => {
    let requests = 0;
    const c = client(async () => { requests++; return page([]); });
    const controller = new AbortController(); controller.abort();
    await expect(c.listMembershipPayments({ membershipId: "mem_qa", whopUserId: "user_qa" }, controller.signal))
      .rejects.toMatchObject({ kind: "unavailable" });
    expect(requests).toBe(0);
  });

  it("rejects an injected payment/cursor before credential use", async () => {
    let requests = 0;
    const c = client(async () => { requests++; return page([]); });
    await expect(c.listPaymentDisputes({ paymentId: "pay_qa?account_id=biz_foreign" })).rejects.toThrow();
    await expect(c.listPaymentRefunds({ paymentId: "pay_qa", after: "cursor&account_id=biz_other" })).rejects.toThrow();
    expect(requests).toBe(0);
  });
});
