import "server-only";

import { platformFailure } from "../database/platform-migration-contract";

const MOOMOO_API_ORIGIN = "https://webapi.moomoo.com";
const SAFE_TEXT = /^[^\u0000-\u001f\u007f]+$/u;

export const MOOMOO_SUPPORTED_TRADE_MARKETS = Object.freeze([
  "US", "HK", "SG", "JP", "AU", "CA", "BMS", "SH", "SZ",
] as const);

export type MoomooTradeMarket = typeof MOOMOO_SUPPORTED_TRADE_MARKETS[number];

export type MoomooAuthorizedTradingAccount = Readonly<{
  accountId: string;
  securityFirm: string;
  enabledMarketCodes: readonly number[];
  accountType: "cash" | "margin" | "unknown";
}>;

export type MoomooHistoricalFill = Readonly<{
  side: "buy" | "sell";
  dealId: string;
  orderId: string;
  code: string;
  stockName: string;
  quantityDecimal: string;
  priceDecimal: string;
  createdMicroseconds: number;
  updatedMicroseconds: number;
  status: string;
}>;

export type MoomooHistoricalFillPage = Readonly<{
  fills: readonly MoomooHistoricalFill[];
  nextPageFlag: string;
  completed: boolean;
}>;

type JsonRecord = Record<string, unknown>;

function record(value: unknown, stage: string): JsonRecord {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    platformFailure("TRADERLINK_BROKER_CONNECTION_STORAGE_INVALID", { stage });
  }
  return value as JsonRecord;
}

function text(value: unknown, field: string, maximumLength = 255): string {
  if (
    typeof value !== "string" || value.length < 1 || value.length > maximumLength ||
    !SAFE_TEXT.test(value)
  ) {
    platformFailure("TRADERLINK_BROKER_CONNECTION_STORAGE_INVALID", { field });
  }
  return value;
}

function optionalText(value: unknown, field: string, maximumLength = 255): string {
  if (value === "") return "";
  return text(value, field, maximumLength);
}

function positiveDecimal(value: unknown, field: string): string {
  const candidate = text(value, field, 128);
  if (!/^(?:0|[1-9][0-9]*)(?:\.[0-9]+)?$/u.test(candidate) || Number(candidate) <= 0) {
    platformFailure("TRADERLINK_BROKER_CONNECTION_STORAGE_INVALID", { field });
  }
  return candidate;
}

function microseconds(value: unknown, field: string): number {
  if (!Number.isSafeInteger(value) || Number(value) <= 0) {
    platformFailure("TRADERLINK_BROKER_CONNECTION_STORAGE_INVALID", { field });
  }
  return Number(value);
}

function parseProviderEnvelope(payload: unknown): JsonRecord {
  const envelope = record(payload, "provider_envelope");
  if (envelope.s !== "ok") {
    const providerCode = Number.isSafeInteger(envelope.errcode)
      ? Number(envelope.errcode)
      : null;
    platformFailure("TRADERLINK_BROKER_CONNECTION_ACCESS_DENIED", {
      providerCode: providerCode ?? "unavailable",
      stage: "provider_rejected",
    });
  }
  return record(envelope.d, "provider_data");
}

async function requestMoomoo(
  path: string,
  accessToken: string,
): Promise<JsonRecord> {
  let response: Response;
  try {
    response = await fetch(`${MOOMOO_API_ORIGIN}${path}`, {
      cache: "no-store",
      headers: {
        Accept: "application/json",
        Authorization: `Bearer ${accessToken}`,
      },
    });
  } catch {
    platformFailure("TRADERLINK_BROKER_CONNECTION_ACCESS_DENIED", {
      stage: "provider_network",
    });
  }
  let payload: unknown;
  try {
    payload = await response!.json();
  } catch {
    platformFailure("TRADERLINK_BROKER_CONNECTION_STORAGE_INVALID", {
      httpStatus: response!.status,
      stage: "provider_json",
    });
  }
  if (!response!.ok) {
    platformFailure("TRADERLINK_BROKER_CONNECTION_ACCESS_DENIED", {
      httpStatus: response!.status,
      stage: "provider_http",
    });
  }
  return parseProviderEnvelope(payload);
}

function parseAccount(value: unknown): MoomooAuthorizedTradingAccount {
  const account = record(value, "authorized_account");
  if (!Array.isArray(account.enable_market)) {
    platformFailure("TRADERLINK_BROKER_CONNECTION_STORAGE_INVALID", {
      field: "enable_market",
    });
  }
  const enabledMarketCodes = account.enable_market.map((market) => {
    if (!Number.isSafeInteger(market) || Number(market) < 0) {
      platformFailure("TRADERLINK_BROKER_CONNECTION_STORAGE_INVALID", {
        field: "enable_market",
      });
    }
    return Number(market);
  });
  const accountType = account.acc_type === "cash" || account.acc_type === "margin"
    ? account.acc_type
    : "unknown";
  return Object.freeze({
    accountId: text(account.account_id, "account_id", 128),
    securityFirm: text(account.security_firm, "security_firm", 64),
    enabledMarketCodes: Object.freeze(enabledMarketCodes),
    accountType,
  });
}

function parseFill(value: unknown): MoomooHistoricalFill {
  const fill = record(value, "historical_fill");
  const createdMicroseconds = microseconds(fill.create_time, "create_time");
  const updatedMicroseconds = microseconds(fill.updated_time, "updated_time");
  if (updatedMicroseconds < createdMicroseconds) {
    platformFailure("TRADERLINK_BROKER_CONNECTION_STORAGE_INVALID", {
      field: "updated_time",
    });
  }
  const side = fill.trd_side === "BUY"
    ? "buy" as const
    : fill.trd_side === "SELL"
      ? "sell" as const
      : platformFailure("TRADERLINK_BROKER_CONNECTION_STORAGE_INVALID", {
          field: "trd_side",
        });
  return Object.freeze({
    side,
    dealId: text(fill.deal_id, "deal_id", 255),
    orderId: text(fill.order_id, "order_id", 255),
    code: text(fill.code, "code", 64),
    stockName: text(fill.stock_name, "stock_name", 255),
    quantityDecimal: positiveDecimal(fill.qty, "qty"),
    priceDecimal: positiveDecimal(fill.price, "price"),
    createdMicroseconds,
    updatedMicroseconds,
    status: text(fill.status, "status", 64),
  });
}

export class MoomooTradingReadClient {
  async authorizedAccounts(accessToken: string): Promise<readonly MoomooAuthorizedTradingAccount[]> {
    const data = await requestMoomoo(
      "/api/v1.0/accounts/authorized_trd_accs",
      accessToken,
    );
    if (!Array.isArray(data.accounts)) {
      platformFailure("TRADERLINK_BROKER_CONNECTION_STORAGE_INVALID", {
        field: "accounts",
      });
    }
    return Object.freeze(data.accounts.map(parseAccount));
  }

  async historicalFills(input: Readonly<{
    accessToken: string;
    accountId: string;
    market: MoomooTradeMarket;
    startMicroseconds: number;
    endMicroseconds: number;
    pageFlag?: string;
  }>): Promise<MoomooHistoricalFillPage> {
    const accountId = text(input.accountId, "account_id", 128);
    if (
      !MOOMOO_SUPPORTED_TRADE_MARKETS.includes(input.market) ||
      !Number.isSafeInteger(input.startMicroseconds) || input.startMicroseconds <= 0 ||
      !Number.isSafeInteger(input.endMicroseconds) ||
      input.endMicroseconds <= input.startMicroseconds
    ) {
      platformFailure("TRADERLINK_BROKER_CONNECTION_STORAGE_INVALID", {
        stage: "historical_fill_request",
      });
    }
    const pageFlag = input.pageFlag ?? "";
    if (pageFlag.length > 4096 || /[\u0000-\u001f\u007f]/u.test(pageFlag)) {
      platformFailure("TRADERLINK_BROKER_CONNECTION_STORAGE_INVALID", {
        field: "page_flag",
      });
    }
    const query = new URLSearchParams({
      end: String(input.endMicroseconds),
      page_flag: pageFlag,
      page_size: "50",
      start: String(input.startMicroseconds),
      trd_market: input.market,
    });
    const data = await requestMoomoo(
      `/api/v1.0/accounts/${encodeURIComponent(accountId)}/fills_history?${query}`,
      input.accessToken,
    );
    if (!Array.isArray(data.order_fills) || typeof data.completed !== "boolean") {
      platformFailure("TRADERLINK_BROKER_CONNECTION_STORAGE_INVALID", {
        stage: "historical_fill_page",
      });
    }
    const nextPageFlag = optionalText(data.page_flag, "page_flag", 4096);
    if (!data.completed && nextPageFlag.length === 0) {
      platformFailure("TRADERLINK_BROKER_CONNECTION_STORAGE_INVALID", {
        stage: "missing_page_flag",
      });
    }
    return Object.freeze({
      fills: Object.freeze(data.order_fills.map(parseFill)),
      nextPageFlag,
      completed: data.completed,
    });
  }
}
