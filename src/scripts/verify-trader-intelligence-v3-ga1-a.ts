import { spawnSync } from "node:child_process";
import { existsSync } from "node:fs";
import { resolve } from "node:path";

type Stage = Readonly<{
  name: string;
  command: string;
  args: readonly string[];
  env?: NodeJS.ProcessEnv;
}>;

const node = process.execPath;
const vitest = resolve("node_modules/vitest/vitest.mjs");
const tsx = resolve("node_modules/tsx/dist/cli.mjs");
if (!existsSync(vitest) || !existsSync(tsx)) {
  process.stderr.write("GA1-A verifier blocked: bundled Vitest/tsx runtime is unavailable; run npm ci.\n");
  process.exit(2);
}

const focusedFiles = [
  "src/lib/trader-intelligence-v3/__tests__/ga1-a/query-plan-contract.test.ts",
  "src/lib/trader-intelligence-v3/__tests__/ga1-a/query-filters-grouping.test.ts",
  "src/lib/trader-intelligence-v3/__tests__/ga1-a/query-metrics-execution-replay.test.ts",
  "src/lib/trader-intelligence-v3/__tests__/ga1-a/query-audit-remediation-registry.test.ts",
  "src/lib/trader-intelligence-v3/__tests__/ga1-a/query-completed-streaks.test.ts",
  "src/lib/trader-intelligence-v3/__tests__/ga1-a/query-expanded-statistics.test.ts",
  "src/lib/trader-intelligence-v3/__tests__/ga1-a/query-property-scale.test.ts",
] as const;

const skipScale = process.argv.includes("--skip-scale");
const scaleOnly = process.argv.includes("--scale-only");
if (skipScale && scaleOnly) {
  process.stderr.write("GA1-A verifier flags --skip-scale and --scale-only are mutually exclusive.\n");
  process.exit(2);
}
const stages: readonly Stage[] = [
  ...(!scaleOnly ? [{
    name: "GA1-A focused contracts filters grouping metrics replay and properties",
    command: node,
    args: [vitest, "run", ...focusedFiles, "--reporter=dot", "--maxWorkers=1", "--pool=forks", "--no-file-parallelism"],
  } satisfies Stage] : []),
  ...(!skipScale ? [{
    name: "GA1-A fixed-seed 10000-row scale proof",
    command: node,
    args: [
      vitest, "run",
      "src/lib/trader-intelligence-v3/__tests__/ga1-a/query-property-scale.test.ts",
      "-t", "executes aggregate plus three groupings",
      "--reporter=dot", "--maxWorkers=1", "--pool=forks", "--no-file-parallelism",
    ],
    env: { ...process.env, TI_V3_GA1_A_SCALE_PROOF: "1" },
  } satisfies Stage] : []),
  ...(!scaleOnly ? [{
    name: "Trader Intelligence v3 architecture boundary",
    command: node,
    args: [tsx, "src/scripts/verify-trader-intelligence-v3-architecture.ts"],
  } satisfies Stage, {
    name: "Trader Intelligence v3 private-data safety",
    command: node,
    args: [tsx, "src/scripts/verify-trader-intelligence-v3-private-data.ts"],
  } satisfies Stage] : []),
];

const startedAt = Date.now();
const completed: string[] = [];
for (const stage of stages) {
  process.stdout.write(`\n[GA1-A] ${stage.name}\n`);
  const result = spawnSync(stage.command, stage.args, {
    stdio: "inherit",
    shell: false,
    env: stage.env ?? process.env,
  });
  if (result.error !== undefined || result.status !== 0) {
    process.stderr.write(`\nGA1-A verifier failed at stage: ${stage.name}\n`);
    process.stderr.write(`status=${result.status ?? "environmental_error"}\n`);
    if (result.error !== undefined) process.stderr.write(`${result.error.message}\n`);
    process.exit(result.status === null ? 2 : result.status || 1);
  }
  completed.push(stage.name);
}

process.stdout.write(
  `\nGA1-A verifier passed: ${completed.length}/${stages.length} executed stages; scaleProof=${skipScale ? "skipped_by_explicit_flag" : "passed"}; elapsedMs=${Date.now() - startedAt}; no UI/model/market/broker/database-write/deployment calls.\n`,
);
