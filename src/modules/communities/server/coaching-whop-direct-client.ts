import { coachingDecimalMinor } from "../contracts/coaching-commission-reconciliation";
import type { CoachingDirectPurchase } from "../contracts/coaching-direct-purchase";
import { verifyCoachingWhopOffer, type CoachingWhopBillingExpectation } from "./coaching-whop-offer-verification";

export type CoachingWhopDirectConfiguration = Readonly<{
  environment: "sandbox" | "live";
  apiVersionDate: "2026-10-24";
  apiKey: string;
  applicationOrigin: string;
}>;

function record(value: unknown): Record<string, unknown> {
  if (!value || typeof value !== "object" || Array.isArray(value)) throw new Error("Unexpected Whop response shape.");
  return value as Record<string, unknown>;
}

/** Explicit injected transport: this module never reads environment credentials or runs by import. */
export class CoachingWhopDirectClient {
  private readonly baseUrl: string;
  private readonly applicationOrigin: string;
  constructor(private readonly configuration: CoachingWhopDirectConfiguration, private readonly transport: typeof fetch) {
    if (!["sandbox", "live"].includes(configuration.environment) || configuration.apiVersionDate !== "2026-10-24" || !configuration.apiKey.trim()) throw new Error("Configure an explicit Whop environment, API version and credential.");
    const origin = new URL(configuration.applicationOrigin);
    if (origin.protocol !== "https:" || origin.username || origin.password || origin.search || origin.hash || origin.pathname !== "/") throw new Error("Configure the application HTTPS origin.");
    this.applicationOrigin = origin.origin;
    this.baseUrl = configuration.environment === "sandbox" ? "https://sandbox-api.whop.com/api/v1" : "https://api.whop.com/api/v1";
  }

  private async request(path: string, method: "GET" | "POST" | "PATCH", idempotencyKey?: string, body?: unknown, beforeRequest?:()=>void): Promise<Record<string, unknown>> {
    const headers: Record<string, string> = { Authorization: `Bearer ${this.configuration.apiKey}`, "Api-Version-Date": this.configuration.apiVersionDate, Accept: "application/json" };
    if (body !== undefined) headers["Content-Type"] = "application/json";
    if (idempotencyKey) headers["Idempotency-Key"] = idempotencyKey;
    // Synchronous invocation-bound check immediately before transport. A guard
    // failure is not an unknown network result and is never retried here.
    beforeRequest?.();
    let response: Response;
    try {
      response = await this.transport(this.baseUrl + path, { method, headers, redirect: "manual", cache: "no-store", signal: AbortSignal.timeout(15_000), ...(body === undefined ? {} : { body: JSON.stringify(body) }) });
    } catch {
      throw new Error("Whop request unavailable; reconcile the existing operation before retrying.");
    }
    if (!response.ok) throw new Error(`Whop request did not complete successfully (HTTP ${response.status}).`);
    try { return record(await response.json()); } catch { throw new Error("Unexpected Whop response shape."); }
  }

  /** Existing coach-owned variant; no client-supplied price or checkout fee override. */
  async createCheckout(purchase: CoachingDirectPurchase, returnPath: string, verification: Readonly<{platformAccountId: string; billing: CoachingWhopBillingExpectation; beforeRequest?:()=>void}>): Promise<Readonly<{ checkoutId: string; purchaseUrl: string }>> {
    if (purchase.environment !== this.configuration.environment) throw new Error("Purchase environment mismatch.");
    if (!returnPath.startsWith("/") || returnPath.startsWith("//") || returnPath.includes("\\")) throw new Error("Use an application return path.");
    const redirect = new URL(returnPath, this.applicationOrigin);
    if (redirect.origin !== this.applicationOrigin) throw new Error("Application return origin mismatch.");
    const variant = await this.retrieveVariant(purchase.providerOffer.variantId,verification.beforeRequest);
    const accountFees = await this.retrieveAccountFees(purchase.merchantAccountId,verification.beforeRequest);
    verifyCoachingWhopOffer({ purchase, variant, accountFees, ...verification });
    const result = await this.request("/checkout_configurations", "POST", `coaching-checkout:${purchase.purchaseId}`, {
      account_id: purchase.merchantAccountId,
      plan_id: purchase.providerOffer.variantId,
      metadata: { coaching_purchase_id: purchase.purchaseId },
      redirect_url: redirect.href,
    },verification.beforeRequest);
    if (typeof result.id !== "string" || !result.id || result.account_id !== purchase.merchantAccountId || typeof result.purchase_url !== "string") throw new Error("Whop checkout binding requires reconciliation.");
    const url = new URL(result.purchase_url);
    const host = this.configuration.environment === "sandbox" ? "sandbox.whop.com" : "whop.com";
    if (url.protocol !== "https:" || url.hostname !== host || url.port || url.username || url.password) throw new Error("Whop checkout URL environment mismatch.");
    return Object.freeze({ checkoutId: result.id, purchaseUrl: url.href });
  }

  async retrieveAccount(accountId: string, beforeRequest?:()=>void): Promise<Record<string, unknown>> {
    if (!/^biz_[A-Za-z0-9]+$/.test(accountId)) throw new Error("Invalid Whop merchant reference.");
    return this.request(`/accounts/${encodeURIComponent(accountId)}`, "GET",undefined,undefined,beforeRequest);
  }

  async createConnectedAccount(input: Readonly<{coachUserId:string;email:string;title:string}>): Promise<Record<string,unknown>> {
    return this.request("/accounts","POST",`coaching-account:${input.coachUserId}`,{email:input.email,title:input.title,metadata:{external_id:input.coachUserId}});
  }

  async createOnboardingLink(accountId:string):Promise<string>{
    const result=await this.request("/account_links","POST",undefined,{company_id:accountId,use_case:"account_onboarding",return_url:`${this.applicationOrigin}/coaching/profile`,refresh_url:`${this.applicationOrigin}/api/coaching/whop/onboarding`});
    if(typeof result.url!=="string")throw new Error("Whop onboarding needs reconciliation.");
    const url=new URL(result.url);if(url.protocol!=="https:"||url.username||url.password||!(url.hostname==="whop.com"||url.hostname.endsWith(".whop.com")))throw new Error("Unexpected Whop onboarding destination.");return url.href;
  }

  async createOffer(input:Readonly<{agreementId:string;merchantAccountId:string;title:string;description:string;currency:string;priceAmountMinor:number;billing:CoachingWhopBillingExpectation;beforeRequest?:()=>void;observedProductId?:string;onProduct?:(value:{productId:string})=>void;onVariant?:(value:{productId:string;variantId:string})=>void}>):Promise<Readonly<{productId:string;variantId:string}>>{
    const exactMajor=(minor:number)=>{if(!Number.isSafeInteger(minor)||minor<0)throw new Error("Invalid offer amount.");const major=minor/100;if(coachingDecimalMinor(String(major),2)!==minor)throw new Error("Qualify provider monetary precision for this offer.");return major;};
    const product=input.observedProductId?{id:input.observedProductId}:await this.request("/products","POST",`coaching-product:${input.agreementId}`,{account_id:input.merchantAccountId,title:input.title,description:input.description,visibility:"hidden"},input.beforeRequest);
    if(typeof product.id!=="string"||!product.id.startsWith("prod_"))throw new Error("Whop product creation needs reconciliation.");
    if(!input.observedProductId)input.onProduct?.({productId:product.id});
    const variant=await this.request("/variants","POST",`coaching-variant:${input.agreementId}`,{account_id:input.merchantAccountId,product_id:product.id,adaptive_pricing_enabled:false,currency:input.currency.toLowerCase(),plan_type:input.billing.planType,billing_period:input.billing.periodDays,initial_price:input.billing.planType==='one_time'?exactMajor(input.priceAmountMinor):0,renewal_price:input.billing.planType==='renewal'?exactMajor(input.billing.renewalPriceMinor):0,metadata:{coaching_agreement_id:input.agreementId}},input.beforeRequest);
    if(typeof variant.id!=="string"||!variant.id.startsWith("plan_"))throw new Error("Whop variant creation needs reconciliation.");
    const result=Object.freeze({productId:product.id,variantId:variant.id});input.onVariant?.(result);return result;
  }

  async retrieveVariant(variantId: string, beforeRequest?:()=>void): Promise<Record<string, unknown>> {
    if (!/^plan_[A-Za-z0-9]+$/.test(variantId)) throw new Error("Invalid Whop variant reference.");
    return this.request(`/variants/${encodeURIComponent(variantId)}`, "GET",undefined,undefined,beforeRequest);
  }

  /** One connected coach account only; never modifies platform defaults. */
  async setPaymentMarkup(input:{merchantAccountId:string;platformAccountId:string;basisPoints:number;operationKey:string}):Promise<void>{
    if(!/^biz_[A-Za-z0-9]+$/.test(input.merchantAccountId)||!input.platformAccountId||!Number.isSafeInteger(input.basisPoints)||input.basisPoints<0||input.basisPoints>10000||!input.operationKey)throw new Error('Check the connected coach markup.');
    const fees=await this.retrieveAccountFees(input.merchantAccountId),markup=record(record(fees.markups).payments);
    if(fees.account_id!==input.merchantAccountId||fees.parent_account_id!==input.platformAccountId||markup.adjustable!==true)throw new Error('The platform is not permitted to configure this coach markup.');
    await this.request(`/accounts/${encodeURIComponent(input.merchantAccountId)}/fees`,'PATCH',input.operationKey,{markups:{payments:{percentage:input.basisPoints/100,fixed:0}}});
  }

  async retrieveAccountFees(accountId: string, beforeRequest?:()=>void): Promise<Record<string, unknown>> {
    if (!/^biz_[A-Za-z0-9]+$/.test(accountId)) throw new Error("Invalid Whop merchant reference.");
    return this.request(`/accounts/${encodeURIComponent(accountId)}/fees`, "GET",undefined,undefined,beforeRequest);
  }

  /** Caller must bind/normalize native response and reconcile amounts before recording payment. */
  async retrievePayment(paymentId: string): Promise<Record<string, unknown>> {
    if (!/^pay_[A-Za-z0-9]+$/.test(paymentId)) throw new Error("Invalid Whop payment reference.");
    return this.request(`/payments/${encodeURIComponent(paymentId)}`, "GET");
  }

  async retrieveCommissionActivity(platformAccountId:string,paymentId:string,after?:string):Promise<Record<string,unknown>>{
    if(!/^biz_[A-Za-z0-9]+$/.test(platformAccountId)||!/^pay_[A-Za-z0-9]+$/.test(paymentId)||after!==undefined&&(!after||after.length>1024))throw new Error('Invalid commission ledger scope.');
    const query=new URLSearchParams({account_id:platformAccountId,payment_id:paymentId,first:'100',include_resource:'false'});if(after)query.set('after',after);
    return this.request(`/financial_activity?${query.toString()}`,'GET');
  }
  async retrieveMembership(membershipId:string):Promise<Record<string,unknown>>{
    if(!/^mem_[A-Za-z0-9]+$/.test(membershipId))throw new Error('Invalid Whop membership reference.');
    return this.request(`/memberships/${encodeURIComponent(membershipId)}`,'GET');
  }
}
