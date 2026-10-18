import { z } from "zod";
const object = z.record(z.string(), z.unknown());

// Stripe retains two-decimal charge units for ISK/UGX although our stored ISO
// currency amounts have zero decimals. https://docs.stripe.com/currencies
export function membershipStripeAmount(amount: number, currency: string): string {
  const converted = amount * (["ISK", "UGX"].includes(currency) ? 100 : 1);
  if (!Number.isSafeInteger(converted)) throw new Error("This price cannot be sent to Stripe exactly.");
  return String(converted);
}

export async function stripeRequest(path: string, values?: Record<string, string>, idempotencyKey?: string): Promise<Record<string, unknown>> {
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) throw new Error("Stripe is not connected yet.");
  const response = await fetch(`https://api.stripe.com/v1/${path}`, { method: values ? "POST" : "GET",
    headers: { Authorization: `Bearer ${key}`, ...(values ? { "Content-Type": "application/x-www-form-urlencoded" } : {}),
      ...(idempotencyKey ? { "Idempotency-Key": idempotencyKey } : {}) },
    body: values ? new URLSearchParams(values) : undefined, cache: "no-store", signal: AbortSignal.timeout(20_000) });
  if (!response.ok) throw new Error("Stripe could not complete this request. Check the provider configuration and try again.");
  return object.parse(await response.json());
}

export function membershipAmountFromStripe(amount: unknown, currency: string): number {
  const value = z.number().int().nonnegative().max(Number.MAX_SAFE_INTEGER).parse(amount);
  const divisor = ["ISK", "UGX"].includes(currency.toUpperCase()) ? 100 : 1;
  if (value % divisor) throw new Error("This invoice amount cannot be represented exactly.");
  return value / divisor;
}
