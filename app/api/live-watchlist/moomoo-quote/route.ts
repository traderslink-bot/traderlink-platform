import { NextResponse, type NextRequest } from "next/server";

import {
  fetchWatchlistMoomooQuotes,
  MAX_WATCHLIST_MOOMOO_QUOTE_SYMBOLS,
} from "@/src/modules/watchlist/server/moomoo-watchlist-quote-bridge";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const SYMBOL_PATTERN = /^[A-Z][A-Z0-9.-]{0,15}$/u;

function expectedToken(): string | null {
  return process.env.TRADERSLINK_WATCHLIST_PUBLISHER_TOKEN?.trim() || null;
}

function getBearerToken(request: NextRequest): string | null {
  const header = request.headers.get("authorization") ?? "";
  return header.toLowerCase().startsWith("bearer ")
    ? header.slice("bearer ".length).trim() || null
    : null;
}

function requestedSymbols(value: unknown): readonly string[] | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;
  const symbols = (value as Record<string, unknown>).symbols;
  if (!Array.isArray(symbols) || symbols.length === 0 || symbols.length > MAX_WATCHLIST_MOOMOO_QUOTE_SYMBOLS) return null;
  const normalized = [...new Set(symbols.map((symbol) => typeof symbol === "string" ? symbol.trim().toUpperCase() : ""))];
  return normalized.length > 0 && normalized.every((symbol) => SYMBOL_PATTERN.test(symbol))
    ? Object.freeze(normalized)
    : null;
}

export async function POST(request: NextRequest): Promise<NextResponse> {
  const token = expectedToken();
  if (!token) {
    return NextResponse.json({ error: "Live watchlist publisher token is not configured." }, { status: 503 });
  }
  if (getBearerToken(request) !== token) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid quote request." }, { status: 400 });
  }
  const symbols = requestedSymbols(body);
  if (!symbols) {
    return NextResponse.json({ error: "Invalid quote request." }, { status: 400 });
  }

  try {
    const result = await fetchWatchlistMoomooQuotes({ symbols });
    if (!result.ok) {
      return NextResponse.json({ status: "unavailable", code: result.code }, { status: 503 });
    }
    return NextResponse.json(
      { status: "ready", provider: "moomoo_open_api", quotes: result.quotes },
      { headers: { "Cache-Control": "no-store" } },
    );
  } catch {
    return NextResponse.json({ status: "unavailable", code: "moomoo_connection_unavailable" }, { status: 503 });
  }
}