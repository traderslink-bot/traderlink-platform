// @vitest-environment node
import { describe, expect, it } from "vitest";
import { PartnerAlertRetentionHoldRepository } from "./partner-alert-retention-holds";

const communityId = "11111111-1111-4111-8111-111111111111";
const holdRef = "22222222-2222-4222-8222-222222222222";
const message = { communityId, sourceChannelId: "810000000000000001", messageId: "810000000000000002" };
const key = { keyRef: "retention-key-v1", key: new Uint8Array(32).fill(4) };

describe("Partner Channel retention holds", () => {
  it("stores only keyed bindings and blocks matching message purge", () => {
    const values: unknown[][] = [];
    const db = { prepare: (sql: string) => { void sql; return ({
      run: (...args: unknown[]) => { values.push(args); return { changes: 1 }; },
      get: () => ({ found: 1 }),
    }); } };
    const repository = new PartnerAlertRetentionHoldRepository(db as never, [key]);
    repository.create({ ...message, holdRef, kind: "dispute", evidence: "provider dispute secret",
      createdAtUtc: "2026-11-02T12:00:00.000Z", keyRef: key.keyRef });
    expect(repository.hasActive(message)).toBe(true);
    const serialized = JSON.stringify(values);
    expect(serialized).not.toContain(communityId);
    expect(serialized).not.toContain(message.sourceChannelId);
    expect(serialized).not.toContain(message.messageId);
    expect(serialized).not.toContain("provider dispute secret");
  });

  it("requires an exact active hold for release", () => {
    const db = { prepare: () => ({ run: () => ({ changes: 0 }), get: () => undefined }) };
    const repository = new PartnerAlertRetentionHoldRepository(db as never, [key]);
    expect(() => repository.release(holdRef,"2026-11-02T13:00:00.000Z")).toThrow();
  });
});
