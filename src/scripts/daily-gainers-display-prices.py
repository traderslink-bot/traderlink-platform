"""Fetch as-traded prices for ranked rows without changing the ranking basis."""

from concurrent.futures import ThreadPoolExecutor
from datetime import date, datetime, time, timedelta
from zoneinfo import ZoneInfo


def add_display_prices(sessions, get):
    if not sessions:
        return
    eastern = ZoneInfo("America/New_York")
    calendar = get("https://api.alpaca.markets", "/v2/calendar", start=min(sessions), end=max(sessions))
    windows = {
        entry["date"]: (time.fromisoformat(entry["session_open"]), time.fromisoformat(entry["close"]))
        for entry in calendar if entry["date"] in sessions
    }
    if set(windows) != set(sessions) or any(t.minute or t.second for w in windows.values() for t in w):
        raise ValueError("Display price windows must cover each session and align to hourly bars")
    months = {}
    for day, session in sessions.items():
        for row in session["rows"]:
            if "sessionHigh" in row:
                months.setdefault(day[:7], []).append((day, row))

    def collect(rows):
        start = date.fromisoformat(min(day for day, _ in rows))
        end = date.fromisoformat(max(day for day, _ in rows)) + timedelta(days=1)
        keys = {(day, row["symbol"]) for day, row in rows}
        symbols = sorted({symbol for _, symbol in keys})
        closes = {}
        highs = {}
        for offset in range(0, len(symbols), 100):
            for frame in ("1Day", "1Hour"):
                params = dict(symbols=",".join(symbols[offset:offset+100]), timeframe=frame,
                              start=start.isoformat(), end=end.isoformat(), feed="sip",
                              asof="-", adjustment="raw", limit=10000)
                while True:
                    result = get("https://data.alpaca.markets", "/v2/stocks/bars", **params)
                    for symbol, bars in result["bars"].items():
                        for bar in bars:
                            local = datetime.fromisoformat(bar["t"]).astimezone(eastern)
                            day = local.date().isoformat()
                            key = (day, symbol)
                            if key not in keys or bar["n"] <= 0:
                                continue
                            if frame == "1Day":
                                closes[key] = bar["c"]
                            elif windows[day][0] <= local.time() < windows[day][1]:
                                highs[key] = max(highs.get(key, 0), bar["h"])
                    if not result["next_page_token"]:
                        break
                    params["page_token"] = result["next_page_token"]
        for day, row in rows:
            key = (day, row["symbol"])
            close = closes.get(key)
            high = highs.get(key)
            if close is None or close <= 0 or high is None or high <= 0:
                raise ValueError(f"Missing as-traded prices for {row['symbol']} on {day}")
            row["displayClose"] = float(close)
            row["displayHigh"] = float(max(high, close))

    with ThreadPoolExecutor(max_workers=8) as pool:
        for count, _ in enumerate(pool.map(collect, months.values()), 1):
            if count % 12 == 0:
                print(f"Verified as-traded prices for {count} monthly batches", flush=True)
