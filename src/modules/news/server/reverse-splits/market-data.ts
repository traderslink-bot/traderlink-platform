import "server-only";
import { isoDate, positiveNumber, record, validTicker, type SplitMarketData } from "./contracts";
import { boundedText } from "./sources";

export async function getSplitMarketData(input: Readonly<{
  ticker: string; expectedCloseDate: string; token: string; now: Date; fetcher?: typeof fetch;
}>): Promise<SplitMarketData> {
  if (!validTicker(input.ticker)) throw new Error("reverse_split_ticker_invalid");
  if (!isoDate(input.expectedCloseDate)) throw new Error("reverse_split_close_date_invalid");
  const fetcher = input.fetcher ?? fetch;
  const issues: string[] = [];
  let float: number | null = null, close: number | null = null, closeDate: string | null = null;
  let eligibleSecurity = true;
  const quoteUrl = new URL("https://eodhd.com/api/us-quote-delayed");
  quoteUrl.searchParams.set("api_token", input.token);
  quoteUrl.searchParams.set("s", `${input.ticker}.US`);
  quoteUrl.searchParams.set("fields", "sharesFloat,type,description,bzExchange");
  try {
    const body = record(JSON.parse(await boundedText(quoteUrl, fetcher, {}, 100_000)));
    const quote = record(record(body?.data)?.[`${input.ticker}.US`]);
    float = positiveNumber(quote?.sharesFloat);
    if (float !== null && !Number.isSafeInteger(float)) float = null;
    if (quote && (quote.type !== "STOCK" || /\b(?:warrant|unit|preferred|ETF)\b/iu.test(String(quote.description ?? "")))) eligibleSecurity = false;
    if (!quote) issues.push("security_type_unavailable");
    if (float === null) issues.push("float_unavailable");
  } catch { issues.push("float_source_unavailable"); }
  const dailyUrl = new URL(`https://eodhd.com/api/eod/${input.ticker}.US`);
  for (const [key, value] of Object.entries({ api_token: input.token, fmt: "json", from: input.expectedCloseDate, to: input.expectedCloseDate })) dailyUrl.searchParams.set(key, value);
  try {
    const body: unknown = JSON.parse(await boundedText(dailyUrl, fetcher, {}, 100_000));
    const rows = Array.isArray(body) ? body.map(record).filter((row) => row?.date === input.expectedCloseDate) : [];
    if (rows.length === 1) {
      close = positiveNumber(rows[0]?.close);
      if (close !== null) closeDate = input.expectedCloseDate;
    }
    if (close === null) issues.push("regular_close_unavailable");
  } catch { issues.push("close_source_unavailable"); }
  return { float, floatRetrievedAt: input.now.toISOString(), close, closeDate, expectedCloseDate: input.expectedCloseDate, eligibleSecurity, issues };
}
