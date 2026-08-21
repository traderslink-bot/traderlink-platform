import { linksQuestionBank, listLinksQuestionBankBatch } from
  "@/src/modules/coach/server/coach-ai-chat-question-bank";

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) throw new Error(message);
}

const firstBatch = listLinksQuestionBankBatch(1);
assert(linksQuestionBank.length >= 800,
  `Expected at least 800 Links question-bank cases, found ${linksQuestionBank.length}.`);
assert(firstBatch.length === 30,
  `Expected exactly 30 first-batch questions, found ${firstBatch.length}.`);
assert(new Set(linksQuestionBank.map((item) => item.id)).size === linksQuestionBank.length,
  "Links question bank has duplicate IDs.");
assert(firstBatch.some((item) => item.input === "what was my most profitable trade this year"),
  "First batch must retain the owner-reported annual best-trade question.");
assert(firstBatch.some((item) => item.input === "summarize my trading in march 2026"),
  "First batch must retain the owner-reported March summary question.");
assert(firstBatch.some((item) => item.input === "what broken rule caused me the most losses"),
  "First batch must retain the owner-reported rule-loss question.");
assert(firstBatch.some((item) => item.input === "give me the worst 3 losses"),
  "First batch must retain the owner-reported loss-ranking question.");
assert(firstBatch.some((item) => item.input === "what are my open positions"),
  "First batch must retain the owner-reported open-position question.");
assert(linksQuestionBank.some((item) => item.scopeKind === "named_day"),
  "Question bank must include named-day questions.");
assert(linksQuestionBank.some((item) => item.scopeKind === "named_month"),
  "Question bank must include named-month questions.");
assert(linksQuestionBank.some((item) => item.scopeKind === "named_year"),
  "Question bank must include named-year questions.");
assert(linksQuestionBank.some((item) => item.scopeKind === "follow_up"),
  "Question bank must include multi-turn follow-up questions.");
assert(new Set(linksQuestionBank.map((item) => item.family)).size >= 8,
  "Question bank must cover at least eight trader-question families.");

process.stdout.write(`Links question bank verifier passed: ${linksQuestionBank.length} cases; ${firstBatch.length} in batch 1.\n`);
