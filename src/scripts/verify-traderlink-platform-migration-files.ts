import { readFileSync } from "node:fs";
import { basename, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import ts from "typescript";

import {
  platformMigrationFileEntries,
  type PlatformMigrationFileEntry,
} from "@/src/modules/platform/server/database/platform-migration-manifest";
import {
  platformFailure,
  validatePlatformMigrationManifest,
} from "@/src/modules/platform/server/database/platform-migration-contract";

export type PlatformMigrationFileVerification = Readonly<{
  sourcePath: string;
  migrationId: string;
  moduleNamespace: string;
  executionOrder: number;
}>;

function descriptorObject(expression: ts.Expression | undefined): ts.ObjectLiteralExpression | null {
  if (!expression) return null;
  if (ts.isParenthesizedExpression(expression) || ts.isAsExpression(expression)
    || ts.isSatisfiesExpression(expression) || ts.isTypeAssertionExpression(expression)) {
    return descriptorObject(expression.expression);
  }
  if (ts.isObjectLiteralExpression(expression)) return expression;
  if (ts.isCallExpression(expression) && expression.arguments.length === 1
    && ts.isPropertyAccessExpression(expression.expression)
    && ts.isIdentifier(expression.expression.expression) && expression.expression.expression.text === "Object"
    && expression.expression.name.text === "freeze") return descriptorObject(expression.arguments[0]);
  return null;
}

/** Read source syntax only: comments, strings and unexported decoys are not descriptors. */
function hasExactExportedDescriptor(entry: PlatformMigrationFileEntry, sourceText: string): boolean {
  const source = ts.createSourceFile(entry.sourcePath, sourceText, ts.ScriptTarget.Latest, true);
  if ((source as ts.SourceFile & { parseDiagnostics: readonly ts.Diagnostic[] }).parseDiagnostics.length) return false;
  const keys = new Set(["moduleNamespace", "migrationId", "executionOrder"]);
  let matched = 0;
  for (const statement of source.statements) {
    if (!ts.isVariableStatement(statement) || !statement.modifiers?.some(modifier => modifier.kind === ts.SyntaxKind.ExportKeyword)) continue;
    for (const declaration of statement.declarationList.declarations) {
      const object = descriptorObject(declaration.initializer);
      if (!object) continue;
      const fields = new Map<string, ts.Expression>();
      let relevant = false, invalid = false;
      for (const property of object.properties) {
        const name = property.name;
        if (!name) continue;
        const key = ts.isIdentifier(name) || ts.isStringLiteral(name) ? name.text : null;
        if (key === null) {
          if (ts.isComputedPropertyName(name) && ts.isStringLiteral(name.expression) && keys.has(name.expression.text)) invalid = relevant = true;
          continue;
        }
        if (!keys.has(key)) continue;
        relevant = true;
        if (!ts.isPropertyAssignment(property) || fields.has(key)) { invalid = true; continue; }
        fields.set(key, property.initializer);
      }
      if (!relevant) continue;
      const namespace = fields.get("moduleNamespace"), id = fields.get("migrationId"), order = fields.get("executionOrder");
      if (invalid || fields.size !== 3 || !namespace || !ts.isStringLiteral(namespace)
        || namespace.text !== entry.migration.moduleNamespace || !id || !ts.isStringLiteral(id)
        || id.text !== entry.migration.migrationId || !order || !ts.isNumericLiteral(order)
        || order.getText(source) !== String(entry.migration.executionOrder)) return false;
      matched += 1;
    }
  }
  return matched === 1;
}

export function verifyPlatformMigrationFileEntry(
  entry: PlatformMigrationFileEntry,
  sourceText: string,
): PlatformMigrationFileVerification {
  const filenameStem = basename(entry.sourcePath, ".ts");
  if (
    filenameStem !== entry.migration.migrationId ||
    !hasExactExportedDescriptor(entry, sourceText)
  ) {
    platformFailure("TRADERLINK_MIGRATION_FILE_ID_MISMATCH", {
      sourcePath: entry.sourcePath,
      migrationId: entry.migration.migrationId,
    });
  }
  return Object.freeze({
    sourcePath: entry.sourcePath,
    migrationId: entry.migration.migrationId,
    moduleNamespace: entry.migration.moduleNamespace,
    executionOrder: entry.migration.executionOrder,
  });
}

export function verifyPlatformMigrationFileEntries(
  entries: readonly PlatformMigrationFileEntry[],
  readSource: (entry: PlatformMigrationFileEntry) => string,
): readonly PlatformMigrationFileVerification[] {
  const manifest = validatePlatformMigrationManifest(entries.map(entry => entry.migration));
  const results = entries.map(entry => verifyPlatformMigrationFileEntry(entry, readSource(entry)))
    .sort((left, right) => left.executionOrder - right.executionOrder);
  if (results.some((result, index) => result.migrationId !== manifest[index]?.migrationId
    || result.moduleNamespace !== manifest[index]?.moduleNamespace
    || result.executionOrder !== manifest[index]?.executionOrder)) {
    platformFailure("TRADERLINK_MIGRATION_ORDER_CONFLICT");
  }
  return Object.freeze(results);
}

export function verifyTraderLinkPlatformMigrationFiles(
  repositoryRoot = process.cwd(),
): readonly PlatformMigrationFileVerification[] {
  return verifyPlatformMigrationFileEntries(platformMigrationFileEntries,
    entry => readFileSync(resolve(repositoryRoot, entry.sourcePath), "utf8"));
}

function isDirectExecution(): boolean {
  const invokedPath = process.argv[1];
  if (!invokedPath) return false;
  return resolve(invokedPath).toLowerCase() === fileURLToPath(import.meta.url).toLowerCase();
}

if (isDirectExecution()) {
  try {
    console.info(
      JSON.stringify(
        {
          status: "verified",
          migrations: verifyTraderLinkPlatformMigrationFiles(),
        },
        null,
        2,
      ),
    );
  } catch (error) {
    console.error(
      JSON.stringify({
        code:
          error instanceof Error && error.message.startsWith("TRADERLINK_")
            ? error.message
            : "TRADERLINK_MIGRATION_FILE_VERIFICATION_FAILED",
      }),
    );
    process.exitCode = 1;
  }
}
