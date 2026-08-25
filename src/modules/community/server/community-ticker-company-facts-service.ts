import { getFinnhubCompanyProfile } from "@/src/lib/news/finnhub-company-profile";
import type { CommunityTickerCompanyFacts } from "../contracts/community-watchlist-contracts";
import { withPlatformDatabase } from "../../platform/server/database/open-platform-database";
import { createCanonicalUtcTimestamp } from "../../platform/server/database/platform-migration-contract";
import { CommunityTickerCompanyFactsRepository } from "./community-ticker-company-facts-repository";

export async function getCommunityTickerCompanyFacts(
  symbols: readonly string[],
): Promise<Readonly<Record<string, CommunityTickerCompanyFacts | null>>> {
  const checkedAtUtc = createCanonicalUtcTimestamp();
  const cached = withPlatformDatabase({ mode: "runtime" }, (database) =>
    new CommunityTickerCompanyFactsRepository(database).readFresh(symbols, checkedAtUtc),
  );
  if (!cached.staleSymbols.length) return cached.facts;
  const profiles = await Promise.all(cached.staleSymbols.map(async (symbol) => Object.freeze({
    symbol,
    profile: await getFinnhubCompanyProfile(symbol),
  })));
  return withPlatformDatabase({ mode: "runtime" }, (database) => {
    const repository = new CommunityTickerCompanyFactsRepository(database);
    const save = () => {
      for (const item of profiles) repository.save({ ...item, retrievedAtUtc: checkedAtUtc });
    };
    if (database.inTransaction) save();
    else database.transaction(save).immediate();
    return repository.readAll(symbols);
  });
}
