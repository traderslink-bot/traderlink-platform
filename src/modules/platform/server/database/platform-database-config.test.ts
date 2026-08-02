import { join } from "node:path";

import {
  ACTIVE_TRADERLINK_PLATFORM_REPOSITORY_ROOT,
  defaultForbiddenPlatformDatabaseRoots,
  resolvePlatformDatabaseConfig,
  validatePlatformDatabasePath,
} from "./platform-database-config";

describe("platform database configuration", () => {
  it("requires one nonblank explicit environment value", () => {
    expect(() => resolvePlatformDatabaseConfig({ environment: { NODE_ENV: "test" } })).toThrowError(
      "TRADERLINK_PLATFORM_DB_PATH_MISSING",
    );
    expect(() =>
      resolvePlatformDatabaseConfig({
        environment: { NODE_ENV: "test", TRADERLINK_PLATFORM_DB_PATH: "   " },
      }),
    ).toThrowError("TRADERLINK_PLATFORM_DB_PATH_MISSING");
  });

  it("rejects relative, wrong-extension, and repository-contained paths", () => {
    expect(() => validatePlatformDatabasePath("data/development.sqlite")).toThrowError(
      "TRADERLINK_PLATFORM_DB_PATH_INVALID",
    );
    expect(() =>
      validatePlatformDatabasePath("C:\\private\\development.db", {
        forbiddenRepositoryRoots: [],
      }),
    ).toThrowError("TRADERLINK_PLATFORM_DB_PATH_INVALID");
    expect(() =>
      validatePlatformDatabasePath(
        join(process.cwd(), "data", "development.sqlite"),
      ),
    ).toThrowError("TRADERLINK_PLATFORM_DB_PATH_REPOSITORY_FORBIDDEN");
  });

  it("accepts an absolute external sqlite path without a V3 fallback", () => {
    const configured = resolvePlatformDatabaseConfig({
      environment: { NODE_ENV: "test", TRADERLINK_PLATFORM_DB_PATH: "C:\\private\\platform.sqlite" },
      forbiddenRepositoryRoots: [],
    });
    expect(configured.databasePath.toLowerCase()).toBe("c:\\private\\platform.sqlite");
  });

  it("derives the active and moved repository boundaries without machine-specific roots", () => {
    expect(ACTIVE_TRADERLINK_PLATFORM_REPOSITORY_ROOT).toBe(process.cwd());

    const movedRepositoryRoot = join(
      process.env.TEMP ?? "C:\\Temp",
      "moved-traderlink-platform",
    );
    expect(() =>
      validatePlatformDatabasePath(
        join(movedRepositoryRoot, "data", "development.sqlite"),
        {
          forbiddenRepositoryRoots:
            defaultForbiddenPlatformDatabaseRoots(movedRepositoryRoot),
        },
      ),
    ).toThrowError("TRADERLINK_PLATFORM_DB_PATH_REPOSITORY_FORBIDDEN");
    expect(defaultForbiddenPlatformDatabaseRoots(movedRepositoryRoot)).toEqual([
      movedRepositoryRoot,
    ]);
  });
});
