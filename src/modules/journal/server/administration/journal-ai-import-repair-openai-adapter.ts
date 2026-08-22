import "server-only";

import { createOpenAI } from "@ai-sdk/openai";
import { generateText, Output } from "ai";
import { z } from "zod";

import type { JournalGenericStatementMappingContract } from "../imports/journal-generic-mapped-statement-adapter";
import type { JournalAiImportRepairProvider } from "./journal-ai-import-repair-worker";

const mappingSchema = z.object({
  contractVersion: z.literal("user_confirmed_statement_mapping_v1"),
  brokerName: z.string().min(1).max(120),
  structuralSignatureSha256: z.string().regex(/^[0-9a-f]{64}$/u),
  delimiter: z.enum(["comma", "semicolon", "tab"]),
  tableKind: z.enum(["sectioned", "tabular"]),
  tableLabel: z.string().min(1).max(120),
  headerRowIndex: z.number().int().min(0),
  orderedHeaders: z.array(z.string().min(1).max(120)).min(2).max(4096),
  columns: z.object({
    symbol: z.string().min(1).max(120).optional(),
    timestamp: z.string().min(1).max(120).optional(),
    date: z.string().min(1).max(120).optional(),
    time: z.string().min(1).max(120).optional(),
    side: z.string().min(1).max(120).optional(),
    quantity: z.string().min(1).max(120).optional(),
    price: z.string().min(1).max(120).optional(),
    currency: z.string().min(1).max(120).optional(),
    fees: z.string().min(1).max(120).optional(),
    executionId: z.string().min(1).max(120).optional(),
  }),
  sideValues: z.object({
    buy: z.array(z.string().min(1).max(80)).min(1),
    sell: z.array(z.string().min(1).max(80)).min(1),
  }),
  defaultCurrency: z.string().length(3),
  feeSignConvention: z.enum(["cost_positive", "cash_effect"]),
  sourceTimezone: z.string().min(1).max(80),
});

const SYSTEM = `You configure a CSV statement mapping for TraderLink. Return only the mapping object.
Use only headers and layout actually present in the supplied statement. Do not invent columns,
orders, broker identity, side values, timezone, dates, prices, quantities, or executions. Map a
statement only if it contains a coherent stock-execution table. The result is independently
validated and previewed before any Journal import. Do not include commentary or statement rows.`;

function enabled(environment: NodeJS.ProcessEnv): boolean {
  return environment.TRADERLINK_PLATFORM_AI_IMPORT_REPAIR_ENABLED === "true" &&
    environment.TRADERLINK_PLATFORM_OPENAI_DATA_CONTROLS_ACKNOWLEDGED === "true" &&
    Boolean(environment.OPENAI_API_KEY?.trim());
}

export function createJournalAiImportRepairOpenAiProvider(
  environment: NodeJS.ProcessEnv = process.env,
): JournalAiImportRepairProvider | null {
  if (!enabled(environment)) return null;
  const openai = createOpenAI({ apiKey: environment.OPENAI_API_KEY!.trim() });
  const modelId = environment.TRADERLINK_PLATFORM_AI_IMPORT_REPAIR_MODEL?.trim() || "gpt-5.6";
  return async ({ sourceText, confirmedBrokerName }) => {
    const result = await generateText({
      model: openai(modelId),
      maxOutputTokens: 2_000,
      output: Output.object({ schema: mappingSchema }),
      providerOptions: { openai: { store: false } },
      system: `${SYSTEM}\nThe trader confirmed the broker name as ${JSON.stringify(confirmedBrokerName)}. Set brokerName to that exact value; do not infer or replace it.`,
      prompt: sourceText,
    });
    if (!result.output) throw new Error("TRADERLINK_JOURNAL_AI_REPAIR_NO_MAPPING");
    return result.output as JournalGenericStatementMappingContract;
  };
}
