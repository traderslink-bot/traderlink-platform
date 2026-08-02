import "server-only";

import { neon } from "@neondatabase/serverless";

import { normalizeAffiliateCode } from "@/src/lib/affiliate-referrals/affiliate-referral-store";

let schemaCheck: Promise<boolean> | null = null;

export async function findLegacyDiscordAffiliateCode(
  discordUserId: string | null | undefined,
): Promise<string> {
  const normalizedUserId = String(discordUserId ?? "").trim();
  const databaseUrl = process.env.AFFILIATE_REFERRAL_DATABASE_URL?.trim();
  if (!normalizedUserId || !databaseUrl) return "";

  const sql = neon(databaseUrl);
  schemaCheck ??= sql`
    SELECT table_name
    FROM information_schema.tables
    WHERE table_schema = current_schema()
      AND table_name = 'affiliate_discord_referrals'
  `.then((rows) => (rows as Array<unknown>).length === 1);
  if (!(await schemaCheck)) return "";

  const rows = (await sql`
    SELECT affiliate_code
    FROM affiliate_discord_referrals
    WHERE discord_user_id = ${normalizedUserId}
    LIMIT 1
  `) as Array<{ affiliate_code?: unknown }>;
  return normalizeAffiliateCode(String(rows[0]?.affiliate_code ?? ""));
}
