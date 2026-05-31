import { describe, expect, it } from "vitest";
import { existsSync, readFileSync, readdirSync, statSync } from "node:fs";
import path from "node:path";

const repoRoot = process.cwd();

const executionAnalysisPaths = [
  "src/lib/trade-analysis",
  "src/lib/execution-feedback",
  "src/lib/raw-trade-timeline",
  "src/lib/trade-analysis-engine.ts",
];

const levelAnalysisModules = [
  "src/lib/level-analysis/level-analysis-snapshot-contract.ts",
  "src/lib/level-analysis/level-analysis-snapshot-adapter.ts",
  "src/lib/level-analysis/level-analysis-snapshot-attachment.ts",
  "src/lib/level-analysis/level-analysis-snapshot-storage.ts",
  "src/lib/level-analysis/execution-level-context-input.ts",
];

const prohibitedExportFieldNames = new Set([
  "grade",
  "tradeGrade",
  "coaching",
  "coach",
  "pnl",
  "pAndL",
  "giveback",
  "behaviorScore",
  "behaviorScoring",
  "recommendation",
  "entryDecision",
  "exitDecision",
  "tradeAdvice",
]);

function listTypeScriptFiles(relativePath: string): string[] {
  const absolutePath = path.join(repoRoot, relativePath);

  if (!existsSync(absolutePath)) {
    return [];
  }

  const stat = statSync(absolutePath);
  if (stat.isFile()) {
    return absolutePath.endsWith(".ts") || absolutePath.endsWith(".tsx")
      ? [absolutePath]
      : [];
  }

  return readdirSync(absolutePath).flatMap((entry) => {
    const child = path.join(absolutePath, entry);
    const childStat = statSync(child);

    if (childStat.isDirectory()) {
      return listTypeScriptFiles(path.relative(repoRoot, child));
    }

    return child.endsWith(".ts") || child.endsWith(".tsx") ? [child] : [];
  });
}

function readSource(filePath: string): string {
  return readFileSync(filePath, "utf8");
}

function exportedPropertyNames(source: string): string[] {
  const names: string[] = [];
  const propertyPattern = /^\s{2}([A-Za-z][A-Za-z0-9_]*)[?:]?:/gm;
  let match: RegExpExecArray | null;

  while ((match = propertyPattern.exec(source)) !== null) {
    names.push(match[1]);
  }

  return names;
}

describe("level-analysis execution integration boundary", () => {
  it("keeps execution-analysis modules from importing level-analysis before the input contract gate", () => {
    const files = executionAnalysisPaths.flatMap(listTypeScriptFiles);
    const offenders = files.filter((file) =>
      /from\s+["'][^"']*level-analysis|require\(["'][^"']*level-analysis/.test(
        readSource(file),
      ),
    );

    expect(offenders.map((file) => path.relative(repoRoot, file))).toEqual([]);
  });

  it("keeps level-analysis exported storage and attachment shapes free of journal-owned interpretation fields", () => {
    const exportedNames = levelAnalysisModules.flatMap((relativePath) =>
      exportedPropertyNames(readSource(path.join(repoRoot, relativePath))),
    );
    const prohibited = exportedNames.filter((name) =>
      prohibitedExportFieldNames.has(name),
    );

    expect(prohibited).toEqual([]);
  });
});
