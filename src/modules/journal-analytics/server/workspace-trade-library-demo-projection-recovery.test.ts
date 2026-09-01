import type Database from "better-sqlite3";
import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  findActiveAccount: vi.fn(),
  immediate: vi.fn(),
  refreshProjection: vi.fn(),
}));

vi.mock("@/src/modules/journal/server/demo/journal-demo-account-repository", () => ({
  JournalDemoAccountRepository: class {
    findActiveAccount = mocks.findActiveAccount;
  },
}));

vi.mock("@/src/modules/journal/server/round-trips/journal-round-trip-repository", () => ({
  JournalRoundTripRepository: class {
    immediate = mocks.immediate;
    refreshWorkspaceTradeLibraryProjection = mocks.refreshProjection;
  },
}));

import {
  materializeMissingDemoWorkspaceTradeLibraryProjection,
} from "./workspace-trade-library-demo-projection-recovery";

const scope = Object.freeze({
  activeAccountId: "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa",
  allowedAccountIds: Object.freeze(["aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa"]),
  userId: "bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb",
  workspaceId: "cccccccc-cccc-4ccc-8ccc-cccccccccccc",
  workspaceRole: "owner" as const,
});

function database(input: { hasCurrentExecution: number; revision: object | undefined }): Database.Database {
  return {
    prepare: vi.fn((sql: string) => ({
      get: vi.fn(() => sql.includes("projection_revision_id")
        ? input.revision
        : Object.freeze({ has_current_execution: input.hasCurrentExecution })),
    })),
  } as unknown as Database.Database;
}

describe("legacy Demo Workspace trade-library projection recovery", () => {
  beforeEach(() => {
    mocks.findActiveAccount.mockReset();
    mocks.immediate.mockReset();
    mocks.refreshProjection.mockReset();
    mocks.immediate.mockImplementation((operation: () => boolean) => operation());
  });

  it("materializes only a legacy selected Demo account with canonical executions and no revision", () => {
    mocks.findActiveAccount.mockReturnValue(Object.freeze({ accountId: scope.activeAccountId }));

    expect(materializeMissingDemoWorkspaceTradeLibraryProjection(
      database({ hasCurrentExecution: 1, revision: undefined }),
      scope,
      "2026-09-01T00:00:00.000Z",
    )).toBe(true);
    expect(mocks.refreshProjection).toHaveBeenCalledWith({
      accountId: scope.activeAccountId,
      userId: scope.userId,
      workspaceId: scope.workspaceId,
      workspaceRole: scope.workspaceRole,
    }, "2026-09-01T00:00:00.000Z");
  });

  it("is idempotent after it creates the selected Demo projection revision", () => {
    mocks.findActiveAccount.mockReturnValue(Object.freeze({ accountId: scope.activeAccountId }));
    const state = { hasCurrentExecution: 1, revision: undefined as object | undefined };
    mocks.refreshProjection.mockImplementation(() => {
      state.revision = Object.freeze({ projection_revision_id: "created" });
    });

    expect(materializeMissingDemoWorkspaceTradeLibraryProjection(
      database(state),
      scope,
      "2026-09-01T00:00:00.000Z",
    )).toBe(true);
    expect(materializeMissingDemoWorkspaceTradeLibraryProjection(
      database(state),
      scope,
      "2026-09-01T00:00:01.000Z",
    )).toBe(false);
    expect(mocks.refreshProjection).toHaveBeenCalledTimes(1);
  });

  it("leaves a cleared Demo lifecycle on the read-only path", () => {
    mocks.findActiveAccount.mockReturnValue(null);

    expect(materializeMissingDemoWorkspaceTradeLibraryProjection(
      database({ hasCurrentExecution: 1, revision: undefined }),
      scope,
      "2026-09-01T00:00:00.000Z",
    )).toBe(false);
    expect(mocks.immediate).not.toHaveBeenCalled();
    expect(mocks.refreshProjection).not.toHaveBeenCalled();
  });

  it("does not materialize the selected real account", () => {
    mocks.findActiveAccount.mockReturnValue(null);

    expect(materializeMissingDemoWorkspaceTradeLibraryProjection(
      database({ hasCurrentExecution: 1, revision: undefined }),
      scope,
      "2026-09-01T00:00:00.000Z",
    )).toBe(false);
    expect(mocks.immediate).not.toHaveBeenCalled();
    expect(mocks.refreshProjection).not.toHaveBeenCalled();
  });

  it("does not add filter or cursor input to the established bounded reader contract", () => {
    expect(materializeMissingDemoWorkspaceTradeLibraryProjection).toHaveLength(3);
  });
});
