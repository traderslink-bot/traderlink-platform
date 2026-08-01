import { dirname, extname, isAbsolute, resolve, sep } from "node:path";
import { fileURLToPath } from "node:url";

import { platformFailure } from "./platform-migration-contract";

export const TRADERLINK_PLATFORM_DB_PATH_ENV = "TRADERLINK_PLATFORM_DB_PATH";

export const ACTIVE_TRADERLINK_PLATFORM_REPOSITORY_ROOT = resolve(
  dirname(fileURLToPath(import.meta.url)),
  "../../../../..",
);

export function defaultForbiddenPlatformDatabaseRoots(
  activeRepositoryRoot = ACTIVE_TRADERLINK_PLATFORM_REPOSITORY_ROOT,
): readonly string[] {
  return Object.freeze([resolve(activeRepositoryRoot)]);
}

export const DEFAULT_FORBIDDEN_PLATFORM_DATABASE_ROOTS =
  defaultForbiddenPlatformDatabaseRoots();

function comparablePath(value: string): string {
  const absolute = resolve(value);
  return process.platform === "win32" ? absolute.toLowerCase() : absolute;
}

export function isPathWithinRoot(path: string, root: string): boolean {
  const candidate = comparablePath(path);
  const boundary = comparablePath(root);
  return candidate === boundary || candidate.startsWith(`${boundary}${sep}`);
}

export function validatePlatformDatabasePath(
  configuredPath: string,
  options: Readonly<{
    forbiddenRepositoryRoots?: readonly string[];
  }> = {},
): string {
  if (
    configuredPath.length === 0 ||
    configuredPath.trim() !== configuredPath ||
    !isAbsolute(configuredPath) ||
    extname(configuredPath).toLowerCase() !== ".sqlite"
  ) {
    platformFailure("TRADERLINK_PLATFORM_DB_PATH_INVALID");
  }
  const absolutePath = resolve(configuredPath);
  for (const root of options.forbiddenRepositoryRoots ?? DEFAULT_FORBIDDEN_PLATFORM_DATABASE_ROOTS) {
    if (isPathWithinRoot(absolutePath, root)) {
      platformFailure("TRADERLINK_PLATFORM_DB_PATH_REPOSITORY_FORBIDDEN");
    }
  }
  return absolutePath;
}

export function resolvePlatformDatabaseConfig(
  options: Readonly<{
    environment?: NodeJS.ProcessEnv;
    forbiddenRepositoryRoots?: readonly string[];
  }> = {},
): Readonly<{ databasePath: string }> {
  const configuredPath = (options.environment ?? process.env)[
    TRADERLINK_PLATFORM_DB_PATH_ENV
  ];
  if (configuredPath === undefined || configuredPath.trim().length === 0) {
    platformFailure("TRADERLINK_PLATFORM_DB_PATH_MISSING");
  }
  return Object.freeze({
    databasePath: validatePlatformDatabasePath(configuredPath, options),
  });
}
