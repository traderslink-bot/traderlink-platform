// @vitest-environment node
import Database from "better-sqlite3";
import { beforeEach, expect, it, vi } from "vitest";
import { bootstrapStripeErasureWorker } from "./platform-stripe-erasure-worker-bootstrap";

const fixture = vi.hoisted(() => ({
  source: "1559172784813514803",
  destination: "1559172784813514803",
  provider: vi.fn(),
  bind: vi.fn(),
}));
vi.mock("../../../partner-alerts/server/partner-alert-stripe-erasure-worker-input", () => ({
  readPartnerAlertStripeErasureWorkerInputs: () => ({
    nowUtc: () => "2026-11-17T18:00:00.000Z",
    assertCurrentRelease: () => {},
    erasureRuntime: {},
    roleKeys: {},
    readCurrentConfiguration: () => ({
      outputBindings: [{ sourceGuildId: fixture.source, destinationGuildId: fixture.destination }],
    }),
  }),
}));
vi.mock("./platform-erasure-admission", () => ({
  PlatformErasureAdmission: { bind: () => {
    fixture.bind();
    return {
      lifecycle: () => ({ lifecycle_ref: "lifecycle", erasure_generation: 1 }),
    };
  } },
}));
vi.mock("../../../partner-alerts/server/partner-alert-erasure-runtime", () => ({
  bindPartnerAlertErasureRuntime: () => {},
}));
vi.mock("./platform-stripe-erasure-runtime-binding", () => ({
  hasStripeErasureSchema: () => true,
  bindStripeErasureRuntime: () => {},
}));
vi.mock("./platform-erasure-command", () => ({
  executeStripePreparedErasureCommand: async (_db: unknown, _store: unknown, _command: unknown,
    prepare: (ref: string, fence: { fenceRef: string; generation: number }) => Promise<boolean>) =>
    prepare("op", { fenceRef: "fence", generation: 1 }),
}));
vi.mock("../../../partner-alerts/server/partner-alert-stripe-erasure-runtime", () => ({
  createPartnerAlertStripeErasureRuntime: (_db: unknown, input: { readCurrentConfiguration: () => unknown }) => ({
    prepareRoot: async () => {
      input.readCurrentConfiguration();
      fixture.provider();
      return null;
    },
  }),
}));
beforeEach(() => {
  fixture.source = fixture.destination = "1559172784813514803";
  fixture.provider.mockClear();
  fixture.bind.mockClear();
});

for (const target of ["source", "destination"] as const) {
  it(`refuses foreign ${target} configuration before bootstrap or provider I/O`, () => {
    const db = new Database(":memory:");
    try {
      fixture[target] = "1559172784813514804";
      expect(() => bootstrapStripeErasureWorker(db)).toThrow();
      expect(fixture.bind).not.toHaveBeenCalled();
      expect(fixture.provider).not.toHaveBeenCalled();
    } finally { db.close(); }
  });
}
for (const changed of [false, true]) {
  it(`rechecks target before synthetic provider work, changed=${changed}`, async () => {
    const db = new Database(":memory:");
    try {
      const run = bootstrapStripeErasureWorker(db)!;
      if (changed) fixture.destination = "1559172784813514804";
      // This boundary test stops at provider preparation, before command admission.
      const result = run({} as Parameters<typeof run>[0], {
        scope: { userId: "buyer", workspaceId: "workspace" },
      } as Parameters<typeof run>[1]);
      if (changed) {
        await expect(result).rejects.toThrow();
        expect(fixture.provider).not.toHaveBeenCalled();
      } else {
        await result;
        expect(fixture.provider).toHaveBeenCalledOnce();
      }
    } finally { db.close(); }
  });
}
