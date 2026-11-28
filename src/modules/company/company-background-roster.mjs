const exchangeNames = ["nasdaq", "nyse", "amex"];
const capFloor = 500_000_000;
const maxResponseBytes = 3_000_000;
const symbolPattern = /^[A-Z][A-Z0-9.-]{0,14}$/;
const warrantSuffix = /(?:^[A-Z0-9]{4}W|[.-]WS)$/;

async function exchangeListings(exchange, request) {
  const url = new URL("https://api.nasdaq.com/api/screener/stocks");
  url.searchParams.set("exchange", exchange);
  url.searchParams.set("download", "true");
  const response = await request(url, {
    redirect: "error", signal: AbortSignal.timeout(20_000),
    headers: {
      Accept: "application/json, text/plain, */*",
      Referer: "https://www.nasdaq.com/",
      "User-Agent": "TraderLink company research",
    },
  });
  if (!response.ok || !response.body) throw new Error("Company listing source unavailable");
  const reader = response.body.getReader();
  const chunks = [];
  let bytes = 0;
  try {
    for (;;) {
      const { value, done } = await reader.read();
      if (done) break;
      bytes += value.byteLength;
      if (bytes > maxResponseBytes) throw new Error("Company listing response too large");
      chunks.push(value);
    }
  } finally {
    await reader.cancel().catch(() => {});
  }
  const rows = JSON.parse(Buffer.concat(chunks, bytes))?.data?.rows;
  if (!Array.isArray(rows) || !rows.length || rows.length > 10_000) throw new Error("Invalid company listings");
  return rows;
}

export async function readBackgroundCompanyRoster(request = fetch) {
  const listings = new Map();
  let rowsRead = 0;
  for (const exchange of exchangeNames) {
    const rows = await exchangeListings(exchange, request);
    rowsRead += rows.length;
    for (const row of rows) {
      const symbol = typeof row?.symbol === "string" ? row.symbol.trim().toUpperCase() : "";
      const cap = typeof row?.marketCap === "string" ? Number(row.marketCap) : row?.marketCap;
      if (!symbolPattern.test(symbol) || warrantSuffix.test(symbol) || symbol === "PEWW" ||
          !Number.isSafeInteger(Math.round(cap)) || cap <= capFloor) continue;
      if (listings.has(symbol)) throw new Error("Conflicting company listings");
      listings.set(symbol, exchange);
    }
  }
  if (rowsRead < 100 || rowsRead > 12_000 || listings.size === 0) throw new Error("Incomplete company listings");
  return [...listings.keys()].sort();
}
