import { resolve } from "node:path";
import { fileURLToPath } from "node:url";

import {
  AffiliateReferralStore,
  resetAffiliateReferralStoreForTests,
} from "@/src/lib/affiliate-referrals/affiliate-referral-store";
import {
  resetNewsDatabaseForTests,
  upsertNewsArticle,
} from "@/src/lib/news/news-article-store";
import { PlatformUserRepository } from "@/src/modules/platform/server/identity/platform-user-repository";
import { openPlatformDatabase } from "@/src/modules/platform/server/database/open-platform-database";
import { isTraderLinkPlatformError } from "@/src/modules/platform/server/database/platform-migration-contract";

const USER_ID = "20000000-0000-4000-8000-000000000001";
const TIMESTAMP = "2026-08-02T15:00:00.000Z";

export async function verifyTraderLinkPlatformNewsAffiliateRuntime(): Promise<Readonly<Record<string, unknown>>> {
  const databasePath = process.env.TRADERLINK_PLATFORM_DB_PATH ?? "";
  if (!databasePath.toLowerCase().includes("disposable-verification")) {
    throw new Error("TRADERLINK_DISPOSABLE_DATABASE_REQUIRED");
  }
  const database = openPlatformDatabase({ mode: "runtime" });
  try {
    if (
      Number(
        (database.prepare("SELECT COUNT(*) AS count FROM platform_users").get() as {
          count: number;
        }).count,
      ) !== 0
    ) {
      throw new Error("TRADERLINK_DISPOSABLE_DATABASE_NOT_EMPTY");
    }
    new PlatformUserRepository(database, {
      allowedAuthProviders: ["development_local"],
    }).createUser({
      userId: USER_ID,
      authProvider: "development_local",
      authSubject: "f4_disposable",
      displayName: "F4 disposable verifier",
      createdAtUtc: TIMESTAMP,
      updatedAtUtc: TIMESTAMP,
    });
  } finally {
    database.close();
  }

  await resetNewsDatabaseForTests();
  await resetAffiliateReferralStoreForTests();
  const sourceUrl = "https://example.test/news/shared-release";
  const first = await upsertNewsArticle({
    sourceEventId: "market-event",
    ticker: "TEST",
    headline: "Initial market copy",
    publishedAt: TIMESTAMP,
    routeTag: "market_cap_under_30m",
    sourceUrl,
  });
  const paid = await upsertNewsArticle({
    sourceEventId: "paid-event",
    ticker: "TEST",
    headline: "Canonical paid copy",
    metadata: { supportResistanceLevels: "Support and resistance" },
    publishedAt: TIMESTAMP,
    routeTag: "spike",
    sourceUrl,
  });
  const retry = await upsertNewsArticle({
    sourceEventId: "market-retry",
    ticker: "TEST",
    headline: "Lower priority retry",
    publishedAt: TIMESTAMP,
    routeTag: "market_cap_under_30m",
    sourceUrl,
  });
  if (
    first.id !== paid.id ||
    paid.id !== retry.id ||
    first.revision !== 1 ||
    paid.revision !== 2 ||
    retry.revision !== 2 ||
    retry.headline !== "Canonical paid copy" ||
    retry.metadata.supportResistanceLevels !== "Support and resistance"
  ) {
    throw new Error("TRADERLINK_NEWS_RUNTIME_PROOF_FAILED");
  }

  const affiliate = new AffiliateReferralStore();
  await affiliate.upsertInvite({
    inviteCode: "first-invite",
    affiliateCode: "first-affiliate",
  });
  await affiliate.upsertInvite({
    inviteCode: "second-invite",
    affiliateCode: "second-affiliate",
  });
  await affiliate.recordAttribution({
    platformUserId: USER_ID,
    inviteCode: "first-invite",
    source: "discord_invite",
  });
  const attribution = await affiliate.recordAttribution({
    platformUserId: USER_ID,
    inviteCode: "second-invite",
    joinedAtUtc: TIMESTAMP,
    source: "discord_invite",
  });
  if (
    attribution.affiliateCode !== "first-affiliate" ||
    attribution.inviteCode !== "first-invite" ||
    attribution.joinedAtUtc !== TIMESTAMP
  ) {
    throw new Error("TRADERLINK_AFFILIATE_RUNTIME_PROOF_FAILED");
  }

  await resetNewsDatabaseForTests();
  await resetAffiliateReferralStoreForTests();
  const inspection = openPlatformDatabase({ mode: "runtime" });
  try {
    const counts = Object.freeze({
      newsArticles: Number(
        (inspection.prepare("SELECT COUNT(*) AS count FROM news_articles").get() as {
          count: number;
        }).count,
      ),
      newsVersions: Number(
        (inspection
          .prepare("SELECT COUNT(*) AS count FROM news_article_versions")
          .get() as { count: number }).count,
      ),
      affiliateInvites: Number(
        (inspection.prepare("SELECT COUNT(*) AS count FROM affiliate_invites").get() as {
          count: number;
        }).count,
      ),
      affiliateAttributions: Number(
        (inspection
          .prepare("SELECT COUNT(*) AS count FROM affiliate_attributions")
          .get() as { count: number }).count,
      ),
    });
    if (
      counts.newsArticles !== 1 ||
      counts.newsVersions !== 2 ||
      counts.affiliateInvites !== 2 ||
      counts.affiliateAttributions !== 1 ||
      (inspection.pragma("foreign_key_check") as unknown[]).length !== 0 ||
      inspection.pragma("quick_check", { simple: true }) !== "ok"
    ) {
      throw new Error("TRADERLINK_F4_RUNTIME_COUNTS_FAILED");
    }
    let immutableTrigger = false;
    try {
      inspection
        .prepare("UPDATE news_article_versions SET revision = revision + 1")
        .run();
    } catch (error) {
      immutableTrigger = String(error).includes("news_article_version_immutable");
    }
    if (!immutableTrigger) {
      throw new Error("TRADERLINK_NEWS_IMMUTABILITY_PROOF_FAILED");
    }
    return Object.freeze({
      status: "verified",
      counts,
      canonicalRevision: retry.revision,
      firstTouchAffiliatePreserved: true,
      immutableVersionTrigger: true,
    });
  } finally {
    inspection.close();
  }
}

function isDirectExecution(): boolean {
  const invokedPath = process.argv[1];
  return Boolean(
    invokedPath &&
      resolve(invokedPath).toLowerCase() === fileURLToPath(import.meta.url).toLowerCase(),
  );
}

if (isDirectExecution()) {
  void verifyTraderLinkPlatformNewsAffiliateRuntime()
    .then((result) => console.info(JSON.stringify(result, null, 2)))
    .catch((error) => {
      console.error(
        JSON.stringify({
          code: isTraderLinkPlatformError(error)
            ? error.code
            : error instanceof Error
              ? error.message
              : "TRADERLINK_F4_RUNTIME_VERIFICATION_FAILED",
        }),
      );
      process.exitCode = 1;
    });
}
