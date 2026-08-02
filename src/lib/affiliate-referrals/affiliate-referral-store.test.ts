import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

import Database from "better-sqlite3";
import { afterAll, beforeAll, describe, expect, it } from "vitest";

import {
  AffiliateReferralStore,
  resetAffiliateReferralStoreForTests,
} from "./affiliate-referral-store";

const USER_ONE = "10000000-0000-4000-8000-000000000001";
const USER_TWO = "10000000-0000-4000-8000-000000000002";

describe("AffiliateReferralStore", () => {
  const directory = mkdtempSync(join(tmpdir(), "traderlink-affiliate-"));
  const databasePath = join(directory, "affiliate.sqlite");

  beforeAll(async () => {
    process.env.AFFILIATE_REFERRAL_DB_PATH = databasePath;
    delete process.env.AFFILIATE_REFERRAL_DATABASE_URL;
    await resetAffiliateReferralStoreForTests();
    const store = new AffiliateReferralStore();
    await store.findInvite("initializes-schema");
    const database = new Database(databasePath);
    try {
      database
        .prepare(`INSERT INTO platform_users (
  user_id, auth_provider, auth_subject, display_name, status,
  created_at_utc, updated_at_utc
) VALUES
  (?, 'test', 'affiliate-user-one', 'Affiliate user one', 'active', ?, ?),
  (?, 'test', 'affiliate-user-two', 'Affiliate user two', 'active', ?, ?)`)
        .run(
          USER_ONE,
          "2026-08-02T12:00:00.000Z",
          "2026-08-02T12:00:00.000Z",
          USER_TWO,
          "2026-08-02T12:00:00.000Z",
          "2026-08-02T12:00:00.000Z",
        );
    } finally {
      database.close();
    }
  });

  afterAll(async () => {
    await resetAffiliateReferralStoreForTests();
    delete process.env.AFFILIATE_REFERRAL_DB_PATH;
    rmSync(directory, { recursive: true, force: true });
  });

  it("keeps first-touch attribution and isolates stable Platform users", async () => {
    const store = new AffiliateReferralStore();
    await store.upsertInvite({
      affiliateCode: "first-affiliate",
      inviteCode: "first-invite",
    });
    await store.upsertInvite({
      affiliateCode: "second-affiliate",
      inviteCode: "second-invite",
    });

    const first = await store.recordAttribution({
      platformUserId: USER_ONE,
      inviteCode: "first-invite",
    });
    const repeated = await store.recordAttribution({
      platformUserId: USER_ONE,
      inviteCode: "second-invite",
      joinedAtUtc: "2026-08-02T12:00:00.000Z",
    });
    const otherUser = await store.recordAttribution({
      platformUserId: USER_TWO,
      inviteCode: "second-invite",
    });

    expect(first.affiliateCode).toBe("first-affiliate");
    expect(repeated.affiliateCode).toBe("first-affiliate");
    expect(repeated.inviteCode).toBe("first-invite");
    expect(repeated.joinedAtUtc).toBe("2026-08-02T12:00:00.000Z");
    expect(otherUser.affiliateCode).toBe("second-affiliate");
    expect(await store.findAttributionByPlatformUserId(USER_ONE)).toEqual(repeated);
  });
});
