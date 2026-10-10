"use server";

import { revalidatePath } from "next/cache";
import { requireTraderLinkPlatformPageIdentity } from "@/src/modules/platform/server/authentication/require-platform-request-scope";
import { withPlatformDatabase } from "@/src/modules/platform/server/database/open-platform-database";
import { isMembershipAccessDenied } from "@/src/modules/platform/server/membership/platform-membership-access";
import { PrivateWatchlistRepository } from "@/src/modules/watchlist/server/private/private-watchlist-repository";
import type { MembershipActionState } from "../../admin/journal/memberships/membership-form";
import { PrivateWatchlistGenerationService } from "@/src/modules/watchlist/server/private/private-watchlist-generation-service";
import { PrivateWatchlistRuntimeClient } from "@/src/modules/watchlist/server/private/private-watchlist-runtime-client";

export async function generatePrivateWatchlist(_previous: MembershipActionState, form: FormData): Promise<MembershipActionState> {
  const identity = await requireTraderLinkPlatformPageIdentity();
  try {
    const service = new PrivateWatchlistGenerationService(read => withPlatformDatabase({ mode: "runtime" }, database => read(new PrivateWatchlistRepository(database))), new PrivateWatchlistRuntimeClient());
    const operation = String(form.get("operation") ?? "");
    if (operation !== "generate" && operation !== "reconcile") throw new Error("Invalid generation action.");
    const requestId = String(form.get("requestId") ?? "");
    const outcome = operation === "reconcile" ? await service.reconcile(identity.scope.userId, requestId)
      : await service.generate({ userId: identity.scope.userId, requestId, symbol: String(form.get("symbol") ?? "").trim().toUpperCase(),
        selection: { analysis: form.get("analysis") === "on", indicators: form.get("indicators") === "on", levels: form.get("levels") === "on" } });
    revalidatePath("/private-watchlist");
    return { error: null, success: outcome === "failed" ? "Generation failed. Its confirmed provider cost is recorded; the generation allowance is returned. Existing cards are unchanged." : outcome === "completed" ? "Saved cards are ready."
      : outcome === "not_executed" ? "Generation did not start. Its reserved allowances have been released."
        : "Generation is awaiting confirmation. Check this request again; checking does not start another paid request." };
  } catch (error) {
    if (isMembershipAccessDenied(error)) return { error: "Your current plan does not include one of the selected cards.", success: null };
    if (error instanceof Error && /allowance reached\.$/.test(error.message)) return { error: "Your generation or spending allowance has been reached.", success: null };
    return { error: "Generation is unavailable or the request could not be confirmed. Existing saved cards are unchanged. Check any pending request before starting another.", success: null };
  }
}

export async function changePrivateWatchlist(_previous: MembershipActionState, form: FormData): Promise<MembershipActionState> {
  const identity = await requireTraderLinkPlatformPageIdentity();
  try {
    const symbol = String(form.get("symbol") ?? "");
    const operation = String(form.get("operation") ?? "");
    if (!/^[A-Za-z][A-Za-z0-9.-]{0,9}$/.test(symbol.trim()) || !["add", "archive"].includes(operation)) return { error: "Enter a valid ticker and action.", success: null };
    withPlatformDatabase({ mode: "runtime" }, database => {
      const repository = new PrivateWatchlistRepository(database);
      const at = new Date().toISOString();
      if (operation === "archive") repository.archive(identity.scope.userId, symbol, at);
      else repository.add(identity.scope.userId, symbol, String(form.get("requestId") ?? ""), at);
    });
    revalidatePath("/private-watchlist");
    return { error: null, success: operation === "add" ? "Ticker added to your private Watchlist." : "Ticker archived. Saved work is retained." };
  } catch (error) {
    if (isMembershipAccessDenied(error)) return { error: "Your plan does not include private Watchlist access.", success: null };
    if (error instanceof Error && /^Private Watchlist (ticker_additions|active_tickers) allowance reached\.$/.test(error.message)) return { error: "Your private Watchlist allowance has been reached. Archive an active ticker to free a slot, or review your plan's addition allowance.", success: null };
    return { error: "Your private Watchlist could not be updated. Try again later.", success: null };
  }
}
