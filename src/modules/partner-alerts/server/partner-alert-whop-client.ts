import { PartnerAlertValidationError, type PartnerAlertEnvironment } from "../contracts/partner-alert-contracts";
import { partnerAlertRecord } from "../contracts/partner-alert-validation";

/** Shape pin reviewed against public Whop current-API docs; not provider-qualified. */
export const PARTNER_ALERT_WHOP_API_VERSION = "2026-10-27-2" as const;
export type PartnerAlertWhopTransport = (url: string, options: RequestInit) => Promise<Response>;
export type PartnerAlertWhopClientConfiguration = Readonly<{
  environment: PartnerAlertEnvironment;
  apiVersionDate: typeof PARTNER_ALERT_WHOP_API_VERSION;
  accountId: string;
  bearerToken: string;
}>;

export class PartnerAlertWhopReadError extends Error {
  constructor(readonly kind: "unavailable" | "authorisation" | "not_found" | "scope" | "shape") {
    super("The community’s Whop subscription could not be verified.");
    this.name = "PartnerAlertWhopReadError";
  }
}

function resourceId(value: string, prefix: string): string {
  if (typeof value !== "string" || !value.startsWith(prefix) || value.length <= prefix.length
    || value.length > 128 || !/^[A-Za-z0-9_]+$/u.test(value)) throw new PartnerAlertValidationError("providerReference");
  return value;
}

/** GET-only, explicit injected transport. No fetch default, env read or constructor I/O. */
export class PartnerAlertWhopReadClient {
  private readonly origin: string;
  constructor(private readonly configuration: PartnerAlertWhopClientConfiguration,
    private readonly transport: PartnerAlertWhopTransport) {
    if (configuration.environment !== "sandbox" && configuration.environment !== "live") throw new PartnerAlertValidationError("environment");
    if (configuration.apiVersionDate !== PARTNER_ALERT_WHOP_API_VERSION || typeof transport !== "function"
      || typeof configuration.bearerToken !== "string" || !configuration.bearerToken
      || configuration.bearerToken.length > 8192 || /[\u0000-\u0020\u007f]/u.test(configuration.bearerToken)) {
      throw new PartnerAlertValidationError("whopConfiguration");
    }
    resourceId(configuration.accountId, "biz_");
    this.origin = configuration.environment === "sandbox" ? "https://sandbox-api.whop.com" : "https://api.whop.com";
  }

  private async request(url: URL): Promise<Record<string, unknown>> {
    let response: Response;
    try {
      response = await this.transport(url.href, { method: "GET", redirect: "manual", cache: "no-store",
        headers: { Authorization: `Bearer ${this.configuration.bearerToken}`, Accept: "application/json",
          "Api-Version-Date": this.configuration.apiVersionDate }, signal: AbortSignal.timeout(12_000) });
    } catch { throw new PartnerAlertWhopReadError("unavailable"); }
    if (response.status === 401 || response.status === 403) throw new PartnerAlertWhopReadError("authorisation");
    if (response.status === 404) throw new PartnerAlertWhopReadError("not_found");
    if (!response.ok || response.redirected) throw new PartnerAlertWhopReadError("unavailable");
    const type = response.headers.get("content-type")?.split(";")[0].trim().toLowerCase();
    if (type !== "application/json") throw new PartnerAlertWhopReadError("shape");
    const reader = response.body?.getReader();
    if (!reader) throw new PartnerAlertWhopReadError("shape");
    const pieces: Uint8Array[] = [];
    let size = 0;
    try {
      for (;;) {
        const chunk = await reader.read();
        if (chunk.done) break;
        size += chunk.value.byteLength;
        if (size > 512_000) { await reader.cancel(); throw new PartnerAlertWhopReadError("shape"); }
        pieces.push(chunk.value);
      }
    } catch (error) {
      if (error instanceof PartnerAlertWhopReadError) throw error;
      throw new PartnerAlertWhopReadError("unavailable");
    } finally { reader.releaseLock(); }
    let data: Record<string, unknown>;
    try {
      const bytes = Buffer.concat(pieces);
      data = partnerAlertRecord(JSON.parse(new TextDecoder("utf-8", { fatal: true }).decode(bytes)), "whopResponse");
    } catch { throw new PartnerAlertWhopReadError("shape"); }
    return data;
  }

  private async read(resource: "accounts" | "memberships" | "variants" | "payments", id: string): Promise<Record<string, unknown>> {
    const url = new URL(`/api/v1/${resource}/${encodeURIComponent(id)}`, this.origin);
    if (resource !== "accounts") url.searchParams.set("account_id", this.configuration.accountId);
    const data = await this.request(url);
    let accountId: unknown;
    try { accountId = resource === "accounts" ? data.id : resource === "payments" ? data.account_id
      : partnerAlertRecord(data.account, "account").id; }
    catch { throw new PartnerAlertWhopReadError("scope"); }
    if (data.id !== id || accountId !== this.configuration.accountId) throw new PartnerAlertWhopReadError("scope");
    // Caller normalises immediately and persists only approved minimal evidence.
    return data;
  }

  retrieveAccount(): Promise<Record<string, unknown>> { return this.read("accounts", this.configuration.accountId); }
  retrieveMembership(id: string): Promise<Record<string, unknown>> { return this.read("memberships", resourceId(id, "mem_")); }
  retrieveVariant(id: string): Promise<Record<string, unknown>> { return this.read("variants", resourceId(id, "plan_")); }
  retrievePayment(id: string): Promise<Record<string, unknown>> { return this.read("payments", resourceId(id, "pay_")); }

  /** Native IDs come from a verified member identity, not an email or browser form. */
  async listMemberships(input: Readonly<{ whopUserId: string; after?: string }>): Promise<Readonly<{
    items: readonly Readonly<{ membershipId: string; productId: string; planId: string; status: string }>[];
    hasNextPage: boolean; endCursor: string | null;
  }>> {
    const userId = resourceId(input.whopUserId, "user_");
    if (input.after !== undefined && !/^[A-Za-z0-9_+/=-]{1,2048}$/u.test(input.after)) throw new PartnerAlertValidationError("cursor");
    const url = new URL("/api/v1/memberships", this.origin);
    url.searchParams.set("account_id", this.configuration.accountId);
    url.searchParams.set("user_id", userId); url.searchParams.set("first", "100");
    if (input.after) url.searchParams.set("after", input.after);
    const result = await this.request(url);
    try {
      if (!Array.isArray(result.data) || result.data.length > 100) throw new PartnerAlertWhopReadError("shape");
      const page = partnerAlertRecord(result.page_info, "pageInfo");
      if (typeof page.has_next_page !== "boolean"
        || !(page.end_cursor === null || (typeof page.end_cursor === "string" && /^[A-Za-z0-9_+/=-]{1,2048}$/u.test(page.end_cursor)))
        || (page.has_next_page && (!page.end_cursor || page.end_cursor === input.after))) throw new PartnerAlertWhopReadError("shape");
      const items = result.data.map(value => {
        const row = partnerAlertRecord(value, "membership");
        if (partnerAlertRecord(row.account, "account").id !== this.configuration.accountId
          || row.user_id !== userId || typeof row.status !== "string") throw new PartnerAlertWhopReadError("scope");
        return Object.freeze({ membershipId: resourceId(row.id as string, "mem_"),
          productId: resourceId(row.product_id as string, "prod_"),
          planId: resourceId(row.variant_id as string, "plan_"), status: row.status });
      });
      return Object.freeze({ items: Object.freeze(items), hasNextPage: page.has_next_page,
        endCursor: page.end_cursor as string | null });
    } catch (error) {
      if (error instanceof PartnerAlertWhopReadError) throw error;
      throw new PartnerAlertWhopReadError("shape");
    }
  }

  /** Discover receipt references for an existing purchase; return no buyer/card fields. */
  async listMembershipPayments(input: Readonly<{ whopUserId: string; membershipId: string; after?: string }>): Promise<Readonly<{
    paymentIds: readonly string[]; hasNextPage: boolean; endCursor: string | null;
  }>> {
    const userId = resourceId(input.whopUserId, "user_");
    const membershipId = resourceId(input.membershipId, "mem_");
    if (input.after !== undefined && !/^[A-Za-z0-9_+/=-]{1,2048}$/u.test(input.after)) throw new PartnerAlertValidationError("cursor");
    const url = new URL("/api/v1/payments", this.origin);
    url.searchParams.set("account_id", this.configuration.accountId);
    url.searchParams.set("user_id", userId); url.searchParams.set("membership_id", membershipId);
    url.searchParams.set("include_connected_accounts", "false"); url.searchParams.set("first", "100");
    if (input.after) url.searchParams.set("after", input.after);
    const result = await this.request(url);
    try {
      if (!Array.isArray(result.data) || result.data.length > 100) throw new PartnerAlertWhopReadError("shape");
      const page = partnerAlertRecord(result.page_info, "pageInfo");
      if (typeof page.has_next_page !== "boolean"
        || !(page.end_cursor === null || (typeof page.end_cursor === "string" && /^[A-Za-z0-9_+/=-]{1,2048}$/u.test(page.end_cursor)))
        || (page.has_next_page && (!page.end_cursor || page.end_cursor === input.after))) throw new PartnerAlertWhopReadError("shape");
      const paymentIds = result.data.map(value => {
        const row = partnerAlertRecord(value, "payment");
        if (row.account_id !== this.configuration.accountId || row.membership_id !== membershipId
          || partnerAlertRecord(row.user, "user").id !== userId) throw new PartnerAlertWhopReadError("scope");
        return resourceId(row.id as string, "pay_");
      });
      return Object.freeze({ paymentIds: Object.freeze([...new Set(paymentIds)]), hasNextPage: page.has_next_page,
        endCursor: page.end_cursor as string | null });
    } catch (error) {
      if (error instanceof PartnerAlertWhopReadError) throw error;
      throw new PartnerAlertWhopReadError("shape");
    }
  }
}
