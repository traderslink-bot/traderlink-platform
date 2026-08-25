import type { PlatformMigration } from "@/src/modules/platform/server/database/platform-migration-contract";

function utcCheck(column: string): string {
  return `CHECK (length(${column}) = 24
    AND ${column} GLOB '[0-9][0-9][0-9][0-9]-[0-9][0-9]-[0-9][0-9]T[0-9][0-9]:[0-9][0-9]:[0-9][0-9].[0-9][0-9][0-9]Z')`;
}

const sql = `CREATE TABLE community_ticker_company_facts (
  symbol TEXT PRIMARY KEY CHECK (
    length(symbol) BETWEEN 1 AND 15 AND symbol = upper(symbol)
    AND symbol NOT GLOB '*[^A-Z0-9.-]*'
  ),
  provider TEXT NOT NULL CHECK (provider = 'finnhub'),
  company_name TEXT CHECK (company_name IS NULL OR (length(company_name) <= 240 AND instr(company_name, char(0)) = 0)),
  country TEXT CHECK (country IS NULL OR (length(country) <= 120 AND instr(country, char(0)) = 0)),
  industry TEXT CHECK (industry IS NULL OR (length(industry) <= 240 AND instr(industry, char(0)) = 0)),
  exchange_name TEXT CHECK (exchange_name IS NULL OR (length(exchange_name) <= 160 AND instr(exchange_name, char(0)) = 0)),
  website_url TEXT CHECK (website_url IS NULL OR (length(website_url) <= 500 AND instr(website_url, char(0)) = 0)),
  market_cap_millions REAL CHECK (market_cap_millions IS NULL OR market_cap_millions > 0),
  shares_outstanding_millions REAL CHECK (shares_outstanding_millions IS NULL OR shares_outstanding_millions > 0),
  retrieved_at_utc TEXT NOT NULL ${utcCheck("retrieved_at_utc")}
) STRICT;

CREATE INDEX community_ticker_company_facts_recent
  ON community_ticker_company_facts(retrieved_at_utc DESC);`;

export const communityTickerCompanyFactsMigration: PlatformMigration = Object.freeze({
  moduleNamespace: "community",
  migrationId: "0087_community_ticker_company_facts",
  executionOrder: 87,
  statements: Object.freeze([sql]),
});
