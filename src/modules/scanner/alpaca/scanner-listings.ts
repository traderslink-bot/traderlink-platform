const LISTING_REFRESH_MS = 5 * 60_000;
const SCANNER_EXCHANGES = new Set(["NASDAQ", "NYSE", "AMEX"]);

export function excludedAlpacaListings(value: unknown): readonly string[] {
  if (!Array.isArray(value) || !value.length || value.length > 40_000) throw Error("alpaca_listings_invalid");
  const exclusions = new Set<string>();
  const activeListings = new Set<string>();
  for (const asset of value) {
    if (!asset || typeof asset.symbol !== "string" || typeof asset.exchange !== "string"
      || !["active", "inactive"].includes(asset.status)) throw Error("alpaca_listings_invalid");
    if (asset.status === "inactive" || !SCANNER_EXCHANGES.has(asset.exchange)) exclusions.add(asset.symbol);
    else activeListings.add(asset.symbol);
  }
  return [...exclusions].filter(symbol => !activeListings.has(symbol));
}

export class AlpacaScannerListings {
  private excluded: readonly string[] | undefined;
  private refreshAt = 0;
  private pending: Promise<readonly string[]> | undefined;

  constructor(private readonly credentials: { keyId: string; secretKey: string }) {}

  read(): Promise<readonly string[]> {
    if (this.pending) return this.pending;
    if (Date.now() < this.refreshAt && this.excluded) return Promise.resolve(this.excluded);
    this.pending = this.refresh().finally(() => { this.pending = undefined; });
    return this.pending;
  }

  private async refresh(): Promise<readonly string[]> {
    try {
      const response = await fetch("https://paper-api.alpaca.markets/v2/assets?asset_class=us_equity", {
        headers: { "APCA-API-KEY-ID": this.credentials.keyId, "APCA-API-SECRET-KEY": this.credentials.secretKey },
        signal: AbortSignal.timeout(5000), redirect: "error",
      });
      if (!response.ok) throw Error("alpaca_listings_unavailable");
      this.excluded = excludedAlpacaListings(await response.json());
      this.refreshAt = Date.now() + LISTING_REFRESH_MS;
    } catch (error) {
      if (!this.excluded) throw error;
      this.refreshAt = Date.now() + 30_000;
    }
    return this.excluded;
  }
}
