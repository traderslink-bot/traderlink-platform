import type Database from "better-sqlite3";

import { formatFinnhubMarketCap, type FinnhubCompanyProfile } from "@/src/lib/news/finnhub-company-profile";
import type { CommunityTickerCompanyFacts } from "../contracts/community-watchlist-contracts";
import { assertCanonicalUtcTimestamp, platformFailure } from "../../platform/server/database/platform-migration-contract";

type FactRow = Readonly<{
  symbol: string;
  country: string | null;
  industry: string | null;
  market_cap_millions: number | null;
  shares_outstanding_millions: number | null;
  retrieved_at_utc: string;
}>;

function normalizeSymbol(value: string): string {
  const symbol = value.trim().toUpperCase();
  if (!/^[A-Z0-9][A-Z0-9.-]{0,14}$/u.test(symbol)) {
    platformFailure("TRADERLINK_PLATFORM_STORAGE_VALIDATION_FAILED", { field: "symbol" });
  }
  return symbol;
}

function normalizeSymbols(symbols: readonly string[]): readonly string[] {
  if (!Array.isArray(symbols) || symbols.length > 50) {
    platformFailure("TRADERLINK_PLATFORM_STORAGE_VALIDATION_FAILED", { field: "symbols" });
  }
  return Object.freeze([...new Set(symbols.map(normalizeSymbol))]);
}

function providerText(value: string | null | undefined, maximumLength: number): string | null {
  if (!value) return null;
  const normalized = value.trim();
  return normalized && normalized.length <= maximumLength && !/[\u0000-\u001f\u007f]/u.test(normalized)
    ? normalized
    : null;
}

function displayedFacts(row: FactRow): CommunityTickerCompanyFacts {
  return Object.freeze({
    country: row.country,
    industry: row.industry,
    marketCap: formatFinnhubMarketCap(row.market_cap_millions),
    sharesOutstanding: formatFinnhubMarketCap(row.shares_outstanding_millions),
  });
}

export class CommunityTickerCompanyFactsRepository {
  constructor(private readonly database: Database.Database) {}

  readFresh(symbols: readonly string[], now: string, maximumAgeMs = 604_800_000): Readonly<{
    facts: Readonly<Record<string, CommunityTickerCompanyFacts | null>>;
    staleSymbols: readonly string[];
  }> {
    assertCanonicalUtcTimestamp(now, "now");
    const requested = normalizeSymbols(symbols);
    const statement = this.database.prepare<[string], FactRow>(`SELECT symbol, country, industry,
  market_cap_millions, shares_outstanding_millions, retrieved_at_utc
FROM community_ticker_company_facts WHERE symbol = ?`);
    const facts: Record<string, CommunityTickerCompanyFacts | null> = {};
    const staleSymbols: string[] = [];
    const nowMs = Date.parse(now);
    for (const symbol of requested) {
      const row = statement.get(symbol);
      const retrievedAtMs = row ? Date.parse(row.retrieved_at_utc) : Number.NaN;
      if (!row || Number.isNaN(retrievedAtMs) || nowMs - retrievedAtMs >= maximumAgeMs) {
        staleSymbols.push(symbol);
      } else {
        facts[symbol] = displayedFacts(row);
      }
    }
    return Object.freeze({ facts: Object.freeze(facts), staleSymbols: Object.freeze(staleSymbols) });
  }

  save(input: Readonly<{
    symbol: string;
    profile: FinnhubCompanyProfile | null;
    retrievedAtUtc: string;
  }>): void {
    const symbol = normalizeSymbol(input.symbol);
    assertCanonicalUtcTimestamp(input.retrievedAtUtc, "retrievedAtUtc");
    const profile = input.profile;
    this.database.prepare(`INSERT INTO community_ticker_company_facts (
  symbol, provider, company_name, country, industry, exchange_name, website_url,
  market_cap_millions, shares_outstanding_millions, retrieved_at_utc
) VALUES (?, 'finnhub', ?, ?, ?, ?, ?, ?, ?, ?)
ON CONFLICT(symbol) DO UPDATE SET
  provider = excluded.provider,
  company_name = excluded.company_name,
  country = excluded.country,
  industry = excluded.industry,
  exchange_name = excluded.exchange_name,
  website_url = excluded.website_url,
  market_cap_millions = excluded.market_cap_millions,
  shares_outstanding_millions = excluded.shares_outstanding_millions,
  retrieved_at_utc = excluded.retrieved_at_utc`).run(
      symbol,
      providerText(profile?.name, 240),
      providerText(profile?.country, 120),
      providerText(profile?.industry, 240),
      providerText(profile?.exchange, 160),
      providerText(profile?.weburl, 500),
      profile?.marketCapitalization ?? null,
      profile?.shareOutstanding ?? null,
      input.retrievedAtUtc,
    );
  }

  readAll(symbols: readonly string[]): Readonly<Record<string, CommunityTickerCompanyFacts | null>> {
    const requested = normalizeSymbols(symbols);
    const statement = this.database.prepare<[string], FactRow>(`SELECT symbol, country, industry,
  market_cap_millions, shares_outstanding_millions, retrieved_at_utc
FROM community_ticker_company_facts WHERE symbol = ?`);
    const facts: Record<string, CommunityTickerCompanyFacts | null> = {};
    for (const symbol of requested) {
      const row = statement.get(symbol);
      facts[symbol] = row ? displayedFacts(row) : null;
    }
    return Object.freeze(facts);
  }
}
