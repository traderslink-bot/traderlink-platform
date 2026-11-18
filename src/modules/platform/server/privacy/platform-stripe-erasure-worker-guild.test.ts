// @vitest-environment node
import Database from "better-sqlite3";
import { beforeEach, expect, it, vi } from "vitest";
import { bootstrapStripeErasureWorker } from "./platform-stripe-erasure-worker-bootstrap";

const fixture = vi.hoisted(() => ({
  selectedProfile: undefined as unknown,
  releaseCurrent: true, pending: false,
  v5: false, configurationNull: false, effectMode: "no_discord_effects",
  admit: vi.fn(),
  source: "1559172784813514803",
  destination: "1559172784813514803",
  provider: vi.fn(),
  bind: vi.fn(),
}));
vi.mock("../../../partner-alerts/server/partner-alert-stripe-erasure-worker-input", () => ({
  readPartnerAlertStripeErasureWorkerInputs: () => ({
    ...(fixture.v5 ? { releaseFormat: "v5", effectMode: fixture.effectMode } : {}),
    nowUtc: () => "2026-11-17T18:00:00.000Z",
    assertCurrentRelease: () => { if (!fixture.releaseCurrent) throw Error("stale signed release"); },
    ...(fixture.selectedProfile === undefined ? {} : { erasureProfileRef: fixture.selectedProfile }),
    erasureRuntime: {},
    roleKeys: {},
    readCurrentConfiguration: () => fixture.configurationNull ? null : ({
      outputBindings: [{ sourceGuildId: fixture.source, destinationGuildId: fixture.destination }],
    }),
  }),
}));
vi.mock("./platform-erasure-admission", () => ({
  PlatformErasureAdmission: { bind: () => {
    fixture.bind();
    return {
      pendingFor: () => fixture.pending ? "pending" : null,
      admitRootErasureCommand: fixture.admit,
      lifecycle: () => ({ lifecycle_ref: "lifecycle", erasure_generation: 1, profile_ref: "reviewed_profile" }),
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
      if (input.readCurrentConfiguration()) fixture.provider();
      return null;
    },
  }),
}));
beforeEach(() => {
  fixture.source = fixture.destination = "1559172784813514803";
  fixture.v5 = false;
  fixture.configurationNull = false;
  fixture.effectMode = "no_discord_effects";
  fixture.selectedProfile = undefined;
  fixture.releaseCurrent = true;
  fixture.pending = false;
  fixture.admit.mockClear();
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

for (const scenario of ["new", "stale", "wrong_pending_profile"] as const) {
  it(`uses only the current signed selected profile for deletion onboarding: ${scenario}`, async () => {
    const db = new Database(":memory:");
    try {
      fixture.selectedProfile = scenario === "wrong_pending_profile" ? "other_profile" : "reviewed_profile";
      fixture.pending = scenario === "wrong_pending_profile";
      const run = bootstrapStripeErasureWorker(db)!;
      fixture.releaseCurrent = scenario !== "stale";
      const result = run({} as Parameters<typeof run>[0], {
        scope: { userId: "buyer", workspaceId: "workspace" },
      } as Parameters<typeof run>[1]);
      if (scenario === "new") {
        await result;
        expect(fixture.admit).toHaveBeenCalledOnce();
        expect(fixture.admit.mock.calls[0]![1]).toBe("reviewed_profile");
      } else {
        await expect(result).rejects.toThrow();
        expect(fixture.admit).not.toHaveBeenCalled();
        expect(fixture.provider).not.toHaveBeenCalled();
      }
    } finally { db.close(); }
  });
}

for (const [mode, emptyConfiguration, allowed] of [
  ["no_discord_effects", true, true],
  ["no_discord_effects", false, false],
  ["discord_roles", true, false],
] as const) {
  it(`requires the signed effect mode to match transport configuration: ${mode}, empty=${emptyConfiguration}`, async () => {
    const db = new Database(":memory:");
    try {
      fixture.v5 = true;
      fixture.selectedProfile = "reviewed_profile";
      fixture.effectMode = mode;
      fixture.configurationNull = emptyConfiguration;
      if (!allowed) {
        expect(() => bootstrapStripeErasureWorker(db)).toThrow();
        expect(fixture.bind).not.toHaveBeenCalled();
      } else {
        const run = bootstrapStripeErasureWorker(db)!;
        await run({} as Parameters<typeof run>[0], {
          scope: { userId: "buyer", workspaceId: "workspace" },
        } as Parameters<typeof run>[1]);
        expect(fixture.admit).toHaveBeenCalledOnce();
      }
      expect(fixture.provider).not.toHaveBeenCalled();
    } finally { db.close(); }
  });
}
