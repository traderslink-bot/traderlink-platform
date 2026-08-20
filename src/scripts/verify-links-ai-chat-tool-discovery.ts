import { readFileSync } from "node:fs";
import { resolve } from "node:path";

import { COACH_AI_CHAT_FACTUAL_TOOL_NAMES } from
  "@/src/modules/coach/contracts/coach-ai-chat-factual-tool-contracts";

function invariant(condition: boolean, message: string): asserts condition {
  if (!condition) throw new Error(message);
}

const adapter = readFileSync(resolve(
  process.cwd(),
  "src/modules/coach/server/coach-ai-chat-openai-adapter.ts",
), "utf8");

invariant(adapter.includes("toolSearchTool()"),
  "Links must include the Responses API tool-search capability.");
invariant(adapter.includes("deferLoading: true"),
  "Links factual tools must remain hidden until selected through tool search.");
invariant(adapter.includes("...deferredFactualTools"),
  "The Agent must receive the deferred factual-tool inventory.");
invariant(adapter.includes("promptCacheOptions: { mode: \"explicit\", ttl: \"30m\" }"),
  "Links must use an explicit prompt-cache boundary.");
invariant(!/tools:\s*agentTools[,\n]/u.test(adapter),
  "The Agent must not receive every full factual-tool schema eagerly.");

console.log(JSON.stringify({
  status: "verified",
  factualToolsDiscoverable: COACH_AI_CHAT_FACTUAL_TOOL_NAMES.length,
  eagerFactualToolSchemas: 0,
  autonomousToolSearch: true,
  explicitPromptCache: true,
}));
