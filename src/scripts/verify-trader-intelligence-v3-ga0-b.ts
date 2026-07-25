import { spawnSync } from "node:child_process";
import { existsSync } from "node:fs";
import { resolve } from "node:path";

type Stage = Readonly<{ name: string; command: string; args: readonly string[] }>;

const node = process.execPath;
const vitest = resolve("node_modules/vitest/vitest.mjs");
const tsx = resolve("node_modules/tsx/dist/cli.mjs");
if (!existsSync(vitest) || !existsSync(tsx)) {
  process.stderr.write("GA0-B verifier blocked: bundled Vitest/tsx runtime is unavailable; run npm ci.\n");
  process.exit(2);
}

const stages: readonly Stage[] = [
  {
    name: "B1 dataset and proof contracts",
    command: node,
    args: [vitest, "run", "src/lib/trader-intelligence-v3/__tests__/ga0-b1/analytical-dataset.test.ts", "src/lib/trader-intelligence-v3/__tests__/ga0-b1/proof-contracts.test.ts", "--reporter=dot"],
  },
  {
    name: "B2 weekday production/reference/replay",
    command: node,
    args: [vitest, "run", "src/lib/trader-intelligence-v3/__tests__/ga0-b2/weekday-analysis.test.ts", "src/lib/trader-intelligence-v3/__tests__/ga0-b2/weekday-exact-math.test.ts", "--reporter=dot"],
  },
  {
    name: "B3 daily-stop production/reference/replay",
    command: node,
    args: [vitest, "run", "src/lib/trader-intelligence-v3/__tests__/ga0-b3/daily-stop-analysis.test.ts", "--reporter=dot"],
  },
  {
    name: "B4 registry runner consistency evidence replay",
    command: node,
    args: [vitest, "run", "src/lib/trader-intelligence-v3/__tests__/ga0-b4/runner-and-consistency.test.ts", "--reporter=dot"],
  },
  {
    name: "B4 fixed-seed 10000-row scale proof",
    command: node,
    args: [vitest, "run", "src/lib/trader-intelligence-v3/__tests__/ga0-b4/scale-proof.test.ts", "--reporter=dot"],
  },
  { name: "architecture boundary", command: node, args: [tsx, "src/scripts/verify-trader-intelligence-v3-architecture.ts"] },
  { name: "private-data safety", command: node, args: [tsx, "src/scripts/verify-trader-intelligence-v3-private-data.ts"] },
];

const startedAt = Date.now();
const completed: string[] = [];
for (const stage of stages) {
  process.stdout.write(`\n[GA0-B] ${stage.name}\n`);
  const result = spawnSync(stage.command, stage.args, { stdio: "inherit", shell: false, env: process.env });
  if (result.error !== undefined || result.status !== 0) {
    process.stderr.write(`\nGA0-B verifier failed at stage: ${stage.name}\n`);
    process.stderr.write(`status=${result.status ?? "environmental_error"}\n`);
    if (result.error !== undefined) process.stderr.write(`${result.error.message}\n`);
    process.exit(result.status === null ? 2 : result.status || 1);
  }
  completed.push(stage.name);
}

process.stdout.write(`\nGA0-B verifier passed: ${completed.length}/${stages.length} stages; elapsedMs=${Date.now() - startedAt}; no model/market/broker/deployment calls.\n`);
