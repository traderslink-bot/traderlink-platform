// @vitest-environment node
import { expect, it, vi } from "vitest";
import { createPartnerAlertPaidAuthority } from "./partner-alert-platform-authority";

it("does not open paid authority until the writer and readers are explicitly supplied", async () => {
  expect(createPartnerAlertPaidAuthority(null)).toBeNull();
  const captureV2 = vi.fn(() => ({ kind: "unbound" as const, reason: "unready" }));
  const binding = {
    enabled: false, guildId: "810000000000000001", paidRoleId: "810000000000000002",
    complimentaryRoleId: null, nowUtc: () => "2026-11-14T22:00:00.000Z",
    producer: { captureV2, isCurrentV2: () => false, resolveUserAuthority: () => ({ kind: "unbound" as const }) },
    writer: { run: <T>(operation: () => T) => operation(), isCurrentWriter: () => false },
    history: { readAuthorityHistory: () => ({ previousPaidThroughUtc: null, assignments: [] }) },
    community: { capture: () => ({ kind: "unbound" as const }), isCurrent: () => false },
  };
  expect(createPartnerAlertPaidAuthority(binding)).toBeNull();
  const enabled = createPartnerAlertPaidAuthority({ ...binding, enabled: true });
  expect(enabled).not.toBeNull();
  await expect(enabled!.refresh({ communityId: "11111111-1111-4111-8111-111111111111",
    mappingId: "22222222-2222-4222-8222-222222222222",
    userId: "33333333-3333-4333-8333-333333333333" })).rejects.toThrow();
  expect(captureV2).not.toHaveBeenCalled();
});
