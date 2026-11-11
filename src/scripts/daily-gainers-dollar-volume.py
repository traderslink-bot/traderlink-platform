"""Enrich saved winners with dollar volume from their unadjusted SIP bars."""

from concurrent.futures import ThreadPoolExecutor
from datetime import date, datetime, timedelta
from zoneinfo import ZoneInfo


def add_dollar_volume(sessions, get):
    missing = [(day, row) for day, session in sessions.items() for row in session["rows"]
               if "dollarVolume" not in row]
    if not missing:
        return
    eastern = ZoneInfo("America/New_York")
    monthly = {}
    for day, row in missing:
        monthly.setdefault(day[:7], []).append((day, row))

    def enrich(rows):
        start = min(day for day, _ in rows)
        end = date.fromisoformat(max(day for day, _ in rows)) + timedelta(days=1)
        symbols = sorted({row["symbol"] for _, row in rows})
        volumes = {}
        for offset in range(0, len(symbols), 100):
            params = dict(symbols=",".join(symbols[offset:offset + 100]), start=start, end=end,
                          timeframe="1Day", feed="sip", asof="-", adjustment="raw", limit=10000)
            while True:
                page = get("https://data.alpaca.markets", "/v2/stocks/bars", **params)
                for symbol, bars in page["bars"].items():
                    for bar in bars:
                        day = datetime.fromisoformat(bar["t"]).astimezone(eastern).date().isoformat()
                        if bar["n"] > 0 and bar["v"] > 0 and bar.get("vw", 0) > 0:
                            volumes[day, symbol] = round(bar["v"] * bar["vw"])
                if not page["next_page_token"]:
                    break
                params["page_token"] = page["next_page_token"]
        for day, row in rows:
            row["dollarVolume"] = volumes.get((day, row["symbol"]))

    with ThreadPoolExecutor(max_workers=4) as pool:
        list(pool.map(enrich, monthly.values()))
