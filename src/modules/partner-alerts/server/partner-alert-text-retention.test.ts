// @vitest-environment node
import { describe, expect, it, vi } from "vitest";
import { PartnerAlertTextRetention, startPartnerAlertTextRetention } from "./partner-alert-text-retention";

function fixture(input: Readonly<{ unsettled?: boolean; activeHold?: boolean; profileMismatch?: boolean; restoreReady?: boolean }> = {}) {
  const calls: Array<readonly [string, readonly unknown[]]> = [];
  const database = {
    inTransaction: false,
    transaction: (operation: () => unknown) => ({ immediate: () => {
      database.inTransaction = true;
      try { return operation(); } finally { database.inTransaction = false; }
    } }),
    prepare: (sql: string) => ({
      all: (...values: unknown[]) => {
        calls.push([sql, values]);
        return sql.includes("FROM partner_alert_source_messages")
          ? [{ community_id: "community", source_channel_id: "channel", message_id: "message", first_received_at_utc: "2026-11-01T12:00:00.000Z" }]
          : [];
      },
      get: (...values: unknown[]) => {
        calls.push([sql, values]);
        if (sql.includes("FROM partner_alert_retention_holds")) return input.activeHold ? { found: 1 } : undefined;
        return sql.includes("FROM partner_alert_deliveries") && input.unsettled ? { found: 1 } : undefined;
      },
      run: (...values: unknown[]) => {
        calls.push([sql, values]);
        return { changes: 1 };
      },
    }),
  };
  const core = {
    now: () => "2026-12-02T12:00:00.000Z",
    sweepExpiredClaimText: (_profile: string, cursor: unknown) => ({ changed: 1, next: cursor }),
    assertStorageCurrent: () => undefined,
    profile: () => ({ retention_policy_ref: input.profileMismatch ? "other" : "retention-v1", backup_policy_ref: "backup-v1" }),
  };
  const service = new PartnerAlertTextRetention(database as never, core as never, {
    profileRef: "profile-v1", retentionPolicyRef: "retention-v1", backupPolicyRef: "backup-v1",
    assertRestoreTombstonesApplied: () => { if (input.restoreReady === false) throw new Error("restore_not_ready"); },
    hasActiveRetentionHold: () => input.activeHold === true,
  });
  return { service, calls };
}

describe("Partner Channel text retention", () => {
  it("sweeps a bounded message page and passes the prior cursor to Core", () => {
    const f = fixture();
    const cursor = { operationRef: "operation", participant: "partner_delivery", claimRef: "claim" };
    expect(f.service.redactPage(cursor)).toMatchObject({
      messages: { redactedMessages: 1 }, claims: { changed: 1, next: cursor },
    });
  });

  it("cancels retryable deliveries before clearing all message bodies", () => {
    const f = fixture();
    expect(f.service.redactExpired("2026-12-02T12:00:00.000Z")).toEqual({
      redactedMessages: 1, trackedExternalOperations: 0, trackedPolicyHolds: 0, moreAvailable: false,
    });
    const sql = f.calls.map(([statement]) => statement).join("\n");
    expect(sql.indexOf("SET status='cancelled'")).toBeLessThan(sql.indexOf("SET text_content=NULL"));
    expect(sql).toContain("partner_alert_source_revisions SET text_content=NULL");
    expect(sql).toContain("state=CASE WHEN state='deleted' THEN 'deleted' ELSE 'expired' END");
  });

  it("retains unresolved operation metadata but clears expired text", () => {
    const f = fixture({ unsettled: true });
    expect(f.service.redactExpired("2026-12-02T12:00:00.000Z")).toEqual({
      redactedMessages: 1, trackedExternalOperations: 1, trackedPolicyHolds: 0, moreAvailable: false,
    });
    expect(f.calls.some(([sql]) => sql.includes("SET text_content=NULL"))).toBe(true);
  });

  it("preserves policy hold metadata without retaining expired alert text", () => {
    const f = fixture({ activeHold: true });
    expect(f.service.redactExpired("2026-12-02T12:00:00.000Z")).toEqual({
      redactedMessages: 1, trackedExternalOperations: 0, trackedPolicyHolds: 1, moreAvailable: false,
    });
    expect(f.calls.some(([sql]) => sql.includes("SET text_content=NULL"))).toBe(true);
  });

  it("fails before selecting rows when the installed profile differs", () => {
    const f = fixture({ profileMismatch: true });
    expect(() => f.service.redactExpired("2026-12-02T12:00:00.000Z")).toThrow();
    expect(f.calls).toEqual([]);
  });

  it("fails before selecting rows until restore tombstones are verified", () => {
    const f = fixture({ restoreReady: false });
    expect(() => f.service.redactExpired("2026-12-02T12:00:00.000Z")).toThrow("restore_not_ready");
    expect(f.calls).toEqual([]);
  });
});

it("completes both stores before startup returns and checks later deadlines", () => {
  vi.useFakeTimers();
  try {
    const next = { operationRef: "operation", participant: "partner_delivery", claimRef: "claim" } as const;
    const page = fixture().service.redactPage();
    const moreMessages = { ...page.messages, moreAvailable: true };
    const redactPage = vi.fn<PartnerAlertTextRetention["redactPage"]>()
      .mockReturnValueOnce({ messages: moreMessages, claims: { changed: 1, next } })
      .mockReturnValueOnce({ messages: moreMessages, claims: { changed: 1, next: null } })
      .mockReturnValue({ ...page, claims: { changed: 0, next: null } });
    const stop = startPartnerAlertTextRetention({ redactPage }, vi.fn());
    expect(redactPage.mock.calls).toEqual([
      [null, { messages: true, claims: true }], [next, { messages: true, claims: true }],
      [null, { messages: true, claims: false }],
    ]);
    vi.advanceTimersByTime(60_000);
    expect(redactPage).toHaveBeenLastCalledWith(null, { messages: true, claims: true });
    stop();
    vi.advanceTimersByTime(60_000);
    expect(redactPage).toHaveBeenCalledTimes(4);
    const held = vi.fn<PartnerAlertTextRetention["redactPage"]>(() => { throw new Error("restore not verified"); })
      .mockReturnValueOnce({ messages: page.messages, claims: { changed: 0, next } });
    expect(() => startPartnerAlertTextRetention({ redactPage: held }, vi.fn())).toThrow("restore not verified");
    vi.advanceTimersByTime(60_000);
    expect(held.mock.calls).toEqual([
      [null, { messages: true, claims: true }], [next, { messages: false, claims: true }],
    ]);
  } finally { vi.useRealTimers(); }
});

it("continues a recurring backlog without waiting another minute and cancels it on stop", () => {
  vi.useFakeTimers();
  try {
    const redactPage = vi.fn<PartnerAlertTextRetention["redactPage"]>();
    const page = fixture().service.redactPage();
    const more = { ...page, messages: { ...page.messages, moreAvailable: true } };
    redactPage.mockReturnValueOnce(page).mockReturnValue(more);
    const stop = startPartnerAlertTextRetention({ redactPage }, vi.fn());
    vi.advanceTimersByTime(60_000);
    expect(redactPage).toHaveBeenCalledTimes(2);
    vi.advanceTimersByTime(1);
    expect(redactPage).toHaveBeenCalledTimes(3);
    expect(redactPage).toHaveBeenLastCalledWith(null, { messages: true, claims: false });
    stop();
    vi.advanceTimersByTime(60_000);
    expect(redactPage).toHaveBeenCalledTimes(3);
  } finally { vi.useRealTimers(); }
});
