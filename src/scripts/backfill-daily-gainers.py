"""Build a daily gainers pilot from the read-only Alpaca owner-test feed."""

import argparse
from concurrent.futures import ThreadPoolExecutor
from datetime import date, datetime, time, timedelta
from decimal import Decimal
from fractions import Fraction
import gzip
import hashlib
import heapq
import json
import re
from pathlib import Path
import tempfile
from time import sleep
from urllib.error import HTTPError
from urllib.parse import urlencode
from urllib.request import Request, urlopen
from zoneinfo import ZoneInfo


DATA = "https://data.alpaca.markets"
CALENDAR = "https://api.alpaca.markets"
ASSETS = "https://paper-api.alpaca.markets"
EXCHANGES = {"AMEX", "ARCA", "BATS", "NASDAQ", "NYSE", "NYSEARCA", "NYSEAMERICAN", "IEX"}


class InvalidSymbol(Exception):
    pass


def alpaca_reader():
    credentials = json.loads(
        (Path.home() / ".config/traderlink/alpaca-owner-test.json").read_text()
    )
    headers = {
        "Accept-Encoding": "gzip",
        "APCA-API-KEY-ID": credentials["keyId"],
        "APCA-API-SECRET-KEY": credentials["secretKey"],
    }

    def read_response(response):
        if response.headers.get("Content-Encoding") == "gzip":
            with gzip.GzipFile(fileobj=response) as body:
                return json.load(body, parse_float=Decimal)
        return json.load(response, parse_float=Decimal)

    def get(origin, path, **params):
        request = Request(f"{origin}{path}?{urlencode(params)}", headers=headers)
        for attempt in range(4):
            try:
                with urlopen(request, timeout=30) as response:
                    return read_response(response)
            except HTTPError as error:
                if error.code == 400:
                    message = read_response(error).get("message", "")
                    match = re.fullmatch(r"invalid symbol: (.+)", message)
                    if match:
                        raise InvalidSymbol(match[1]) from None
                if error.code not in {429, 500, 502, 503, 504} or attempt == 3:
                    raise RuntimeError(f"Alpaca {path} returned HTTP {error.code}") from None
                sleep(2 ** (attempt + 1))

    return get


def run(start, end, *, session_high=False):
    get = alpaca_reader()
    calendar = get(CALENDAR, "/v2/calendar", start=start - timedelta(days=10), end=end)
    sessions = [date.fromisoformat(entry["date"]) for entry in calendar]
    prior = max(session for session in sessions if session < start)
    sessions = [session for session in sessions if session >= prior]
    assets = [
        asset for status in ("active", "inactive")
        for asset in get(ASSETS, "/v2/assets", status=status, asset_class="us_equity")
        if asset["exchange"] in EXCHANGES
    ]
    share_name = re.compile(r"\b(?:common (?:stock|shares?)|ordinary shares?|capital stock)\b", re.I)
    other_security = re.compile(
        r"\b(?:warrants?|rights?|units?|preferred|depositary|depository|ETF|ETN)\b", re.I
    )
    classified = {
        asset["symbol"] for asset in assets
        if share_name.search(asset["name"]) and not other_security.search(asset["name"])
    }
    # Only link explicit, same-security symbol changes. Retain the historical
    # ticker in each result and keep changed-CUSIP actions out of the join.
    changes = []
    token = None
    while True:
        params = dict(types="name_change", start="2016-01-01", end=date.today(), limit=1000)
        if token:
            params["page_token"] = token
        page = get(DATA, "/v1/corporate-actions", **params)
        changes.extend(page["corporate_actions"].get("name_changes", []))
        token = page["next_page_token"]
        if not token:
            break

    links = {}
    symbols = set(classified)
    for event in changes:
        old, new = event["old_symbol"], event["new_symbol"]
        if old != new and old and new and event["old_cusip"] and event["old_cusip"] == event["new_cusip"]:
            links.setdefault(event["old_cusip"], set()).add(
                (date.fromisoformat(event["process_date"]), old, new)
            )
    by_symbol = {}
    renames = {}
    for security, events in links.items():
        ordered = sorted(events)
        if any(first[0] >= second[0] or first[2] != second[1]
               for first, second in zip(ordered, ordered[1:])):
            continue
        chain = {ordered[0][1], *(new for _, _, new in ordered)}
        if not classified.intersection(chain):
            continue
        identity = hashlib.sha256(security.encode()).hexdigest()[:20]
        begin = date.min
        for effective, old, new in ordered:
            by_symbol.setdefault(old, []).append((begin, effective, identity))
            renames.setdefault((effective, new), set()).add(old)
            begin = effective
        by_symbol.setdefault(new, []).append((begin, date.max, identity))
        symbols.update(chain)
    symbols = sorted(symbols)
    session_set = set(sessions)
    eastern = ZoneInfo("America/New_York")
    windows = {
        date.fromisoformat(entry["date"]): (
            time.fromisoformat(entry["session_open"]),
            time.fromisoformat(entry["close"]),
        ) for entry in calendar if date.fromisoformat(entry["date"]) >= start
    }
    if session_high and any(t.minute or t.second for window in windows.values() for t in window):
        raise ValueError("A market boundary is not aligned to an hourly bar")

    def fetch_highs(batch):
        highs = {}
        params = dict(symbols=",".join(batch), timeframe="1Hour",
                      start=datetime.combine(start, time.min, eastern).isoformat(),
                      end=datetime.combine(end + timedelta(days=1), time.min, eastern).isoformat(),
                      adjustment="split", feed="sip", asof="-", limit=10000)
        while True:
            page = get(DATA, "/v2/stocks/bars", **params)
            for symbol, bars in page["bars"].items():
                for bar in bars:
                    local = datetime.fromisoformat(bar["t"]).astimezone(eastern)
                    window = windows.get(local.date())
                    if window and window[0] <= local.time() < window[1] and bar["n"] > 0:
                        key = (local.date(), symbol)
                        highs[key] = max(highs.get(key, 0), Fraction(bar["h"]))
            token = page["next_page_token"]
            if not token:
                return highs
            params["page_token"] = token

    def fetch_batch(batch):
        closes = {}
        token = None
        rejected = []
        while True:
            params = dict(symbols=",".join(batch), timeframe="1Day", start=prior,
                          end=end + timedelta(days=1), adjustment="split", feed="sip",
                          asof="-", limit=10000)
            if token:
                params["page_token"] = token
            if not batch:
                return closes, rejected
            try:
                page = get(DATA, "/v2/stocks/bars", **params)
            except InvalidSymbol as error:
                symbol = error.args[0]
                if token or symbol not in batch:
                    raise
                rejected.append(symbol)
                batch = [item for item in batch if item != symbol]
                continue
            for symbol, bars in page["bars"].items():
                for bar in bars:
                    session = datetime.fromisoformat(bar["t"]).astimezone(eastern).date()
                    if session not in session_set or bar["n"] <= 0:
                        continue
                    key = (session, symbol)
                    if key in closes or symbol not in batch or bar["c"] <= 0:
                        raise ValueError(f"Unexpected bar for {symbol} on {session}")
                    closes[key] = Fraction(bar["c"])
            token = page["next_page_token"]
            if not token:
                return closes, rejected

    batches = [symbols[i:i + 200] for i in range(0, len(symbols), 200)]
    with ThreadPoolExecutor(max_workers=4) as pool:
        fetched = list(pool.map(fetch_batch, batches))
    closes = {key: close for batch, _ in fetched for key, close in batch.items()}
    rejected = sorted(symbol for _, batch in fetched for symbol in batch)

    daily = {}
    for (session, symbol), close in closes.items():
        daily.setdefault(session, {})[symbol] = close
    # Exact-symbol bars can use different split bases on either side of a
    # rename. Read the pair through one as-of symbol and normalize its ratio
    # to the close used in the archive. Skip ambiguous or unconfirmed pairs.
    def fetch_rename(job):
        previous, session, symbol = job
        response = get(DATA, "/v2/stocks/bars", symbols=symbol, timeframe="1Day",
                       start=previous, end=session + timedelta(days=1), adjustment="split",
                       feed="sip", asof=session, limit=100)
        pair = {
            datetime.fromisoformat(bar["t"]).astimezone(eastern).date(): Fraction(bar["c"])
            for bar in response["bars"].get(symbol, []) if bar["n"] > 0
        }
        if pair.get(previous, 0) > 0 and pair.get(session, 0) > 0:
            return (session, symbol), pair[previous] / pair[session]
        return (session, symbol), None

    previous_sessions = dict(zip(sessions[1:], sessions))
    jobs = []
    for (session, symbol), old_symbols in renames.items():
        previous = previous_sessions.get(session)
        if previous is None or len(old_symbols) != 1 or symbol not in daily.get(session, {}):
            continue
        old = next(iter(old_symbols))
        if old in daily.get(previous, {}):
            jobs.append((previous, session, symbol))
    with ThreadPoolExecutor(max_workers=4) as pool:
        rename_ratios = dict(pool.map(fetch_rename, jobs))

    highs = {}
    if session_high:
        tradable = {symbol for day, symbol in closes if day >= start} - set(rejected)
        batches = [batch for original in batches if (batch := [symbol for symbol in original if symbol in tradable])]
        with ThreadPoolExecutor(max_workers=4) as pool:
            highs = {key: high for batch in pool.map(fetch_highs, batches) for key, high in batch.items()}

    results = {}
    rename_pairs = 0
    for previous, session in zip(sessions, sessions[1:]):
        candidates = []
        previous_closes = daily.get(previous, {})
        for symbol, close in daily.get(session, {}).items():
            intervals = by_symbol.get(symbol, [])
            identities = {identity for begin, end, identity in intervals if begin <= session < end}
            if len(identities) > 1 or (not identities and symbol not in classified):
                continue
            old_symbols = renames.get((session, symbol), set())
            if len(old_symbols) > 1:
                continue
            previous_symbol = next(iter(old_symbols), symbol)
            base = previous_closes.get(previous_symbol)
            if base is None:
                continue
            if previous_symbol != symbol:
                ratio = rename_ratios.get((session, symbol))
                if ratio is None:
                    continue
                base = close * ratio
                rename_pairs += 1
            identity = next(iter(identities), symbol)
            high = highs.get((session, symbol)) if session_high else close
            if high is None:
                continue
            # The regular closing auction can print exactly at the boundary.
            # Include the daily close without including the following hour.
            peak = max(high, close)
            candidates.append((peak, base, symbol, identity, close))
        gainers = sorted(
            ((base / peak, symbol, peak, base, identity, close)
             for peak, base, symbol, identity, close in candidates if peak > base)
        )[:10]
        audited = heapq.nsmallest(10, (
            (-(peak - base) / base, symbol)
            for peak, base, symbol, _, _ in candidates if peak > base
        ))
        if audited != [(1 - peak / base, symbol) for _, symbol, peak, base, _, _ in gainers]:
            raise ValueError(f"Ranking mismatch for {session}")
        if len(gainers) != 10:
            raise ValueError(f"Incomplete leaderboard for {session}")
        results[str(session)] = {
            "compared": len(candidates),
            "rows": [
                {"symbol": symbol, "security": identity, "close": float(close),
                 "previousClose": float(base), "gain": float((peak / base - 1) * 100),
                 **({"sessionHigh": float(peak)} if session_high else {})}
                for _, symbol, peak, base, identity, close in gainers
            ],
        }
    aliases = {symbol: sorted({identity for _, _, identity in intervals})
               for symbol, intervals in by_symbol.items()}
    return {"symbolCount": len(symbols), "rejectedSymbols": rejected, "sessions": results,
            "aliases": aliases, "renamePairs": rename_pairs, "barCount": len(closes),
            "rankingMethod": "session-high" if session_high else "close-to-close"}


def write_json(output, results):
    with tempfile.NamedTemporaryFile(mode="w", dir=output.parent, delete=False) as file:
        path = Path(file.name)
        try:
            json.dump(results, file, separators=(",", ":"))
            file.write("\n")
            file.close()
            path.replace(output)
        finally:
            path.unlink(missing_ok=True)


if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument("start", type=date.fromisoformat)
    parser.add_argument("end", type=date.fromisoformat)
    parser.add_argument("output", type=Path)
    parser.add_argument("--session-high", action="store_true")
    args = parser.parse_args()
    if args.start > args.end:
        parser.error("start must be on or before end")
    results = run(args.start, args.end, session_high=args.session_high)
    write_json(args.output, results)
    print(f"{len(results['sessions'])} sessions, {results['symbolCount']} candidate symbols, "
          f"{results['barCount']} bars, {results['renamePairs']} rename-day comparisons")
