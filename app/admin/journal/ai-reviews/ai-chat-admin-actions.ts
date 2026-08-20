"use server";

import { headers } from "next/headers";
import { revalidatePath } from "next/cache";

import { CoachAiChatAdministrationRepository } from "@/src/modules/coach/server/coach-ai-chat-administration-repository";
import { withJournalAdminDatabase } from "@/src/modules/platform/server/administration/platform-admin-authorization";
import { isTraderLinkPlatformError } from "@/src/modules/platform/server/database/platform-migration-contract";

type ActionResult = Readonly<{ ok: true }> | Readonly<{ ok: false; message: string }>;

function positiveInteger(value: unknown, field: string): number | null {
  if (value === "" || value === null || value === undefined) return null;
  if (typeof value === "number" && Number.isSafeInteger(value) && value > 0) return value;
  if (typeof value === "string" && /^[1-9]\d{0,15}$/u.test(value)) {
    const parsed = Number(value);
    if (Number.isSafeInteger(parsed)) return parsed;
  }
  throw new Error(`invalid_${field}`);
}

function controlInput(input: Readonly<{
  enabled: unknown;
  dailyRequestCap: unknown;
  dailyTokenCap: unknown;
  dailyEstimatedSpendCapUsd: unknown;
}>): Readonly<{
  enabled: boolean;
  dailyRequestCap: number | null;
  dailyTokenCap: number | null;
  dailyEstimatedSpendCapUsd: unknown;
}> {
  if (typeof input.enabled !== "boolean") throw new Error("invalid_enabled");
  const request = positiveInteger(input.dailyRequestCap, "dailyRequestCap");
  const tokens = positiveInteger(input.dailyTokenCap, "dailyTokenCap");
  const spend = input.dailyEstimatedSpendCapUsd === "" || input.dailyEstimatedSpendCapUsd === null || input.dailyEstimatedSpendCapUsd === undefined
    ? null
    : input.dailyEstimatedSpendCapUsd;
  if (spend !== null && (typeof spend !== "string" || !/^(?:0|[1-9]\d*)(?:\.\d{1,6})?$/u.test(spend))) {
    throw new Error("invalid_dailyEstimatedSpendCapUsd");
  }
  if ((request === null) !== (tokens === null) || (request === null) !== (spend === null)) {
    throw new Error("invalid_dailyCaps");
  }
  return Object.freeze({ enabled: input.enabled, dailyRequestCap: request, dailyTokenCap: tokens, dailyEstimatedSpendCapUsd: spend });
}

function resultFor(error: unknown, invalidMessage: string): ActionResult {
  if (error instanceof Error && error.message.startsWith("invalid_")) {
    return Object.freeze({ ok: false as const, message: invalidMessage });
  }
  if (isTraderLinkPlatformError(error) && error.code === "TRADERLINK_PLATFORM_STORAGE_VALIDATION_FAILED") {
    return Object.freeze({ ok: false as const, message: invalidMessage });
  }
  return Object.freeze({ ok: false as const, message: "Links AI Chat administration is unavailable right now. Try again later." });
}

export async function saveAiChatProviderSettings(input: Readonly<{
  modelId: unknown;
  inputCostUsdPerMillionTokens: unknown;
  cachedInputCostUsdPerMillionTokens: unknown;
  cacheWriteInputCostUsdPerMillionTokens: unknown;
  outputCostUsdPerMillionTokens: unknown;
}>): Promise<ActionResult> {
  try {
    withJournalAdminDatabase(await headers(), (database, scope) =>
      new CoachAiChatAdministrationRepository({ database, scope }).saveSettings(input));
    revalidatePath("/admin/journal/ai-reviews");
    return Object.freeze({ ok: true as const });
  } catch (error) {
    return resultFor(error, "Enter a model ID and all four verified token prices, or leave all four prices blank.");
  }
}

export async function saveAiChatPlatformControl(input: Readonly<{
  enabled: unknown;
  dailyRequestCap: unknown;
  dailyTokenCap: unknown;
  dailyEstimatedSpendCapUsd: unknown;
}>): Promise<ActionResult> {
  try {
    const normalized = controlInput(input);
    withJournalAdminDatabase(await headers(), (database, scope) =>
      new CoachAiChatAdministrationRepository({ database, scope }).savePlatformControl(normalized));
    revalidatePath("/admin/journal/ai-reviews");
    return Object.freeze({ ok: true as const });
  } catch (error) {
    return resultFor(error, "Enter all three positive daily caps before enabling Links AI Chat.");
  }
}

export async function saveAiChatAccountControl(input: Readonly<{
  accountRef: unknown;
  enabled: unknown;
  dailyRequestCap: unknown;
  dailyTokenCap: unknown;
  dailyEstimatedSpendCapUsd: unknown;
}>): Promise<ActionResult> {
  try {
    if (typeof input.accountRef !== "string" || input.accountRef.length < 16) throw new Error("invalid_accountRef");
    const normalized = controlInput(input);
    withJournalAdminDatabase(await headers(), (database, scope) =>
      new CoachAiChatAdministrationRepository({ database, scope }).saveAccountControl(input.accountRef, normalized));
    revalidatePath("/admin/journal/ai-reviews");
    return Object.freeze({ ok: true as const });
  } catch (error) {
    return resultFor(error, "Select a Journal account and enter all three positive daily caps before enabling Links AI Chat.");
  }
}
