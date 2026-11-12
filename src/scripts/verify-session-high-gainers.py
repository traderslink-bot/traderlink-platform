"""Check every saved winning high against independently queried one-minute SIP bars."""

import argparse
from concurrent.futures import ThreadPoolExecutor
from datetime import date, datetime
from decimal import Decimal
import json
from pathlib import Path
import runpy
from zoneinfo import ZoneInfo


backfill = runpy.run_path(str(Path(__file__).with_name("backfill-daily-gainers.py")))
eastern = ZoneInfo("America/New_York")


def verify(directory, start, end):
    sessions = {}
    for path in sorted(directory.glob("*.json")):
        archive = json.loads(path.read_text(), parse_float=Decimal)
        if archive.get("rankingMethod") != "session-high":
            raise ValueError(f"Wrong ranking method in {path.name}")
        sessions.update(archive["sessions"])

    get = backfill["alpaca_reader"]()
    calendar = get(backfill["CALENDAR"], "/v2/calendar", start=start, end=end)
    verify_rows(sessions, calendar, get)


def verify_rows(sessions, calendar, get):
    expected = {entry["date"] for entry in calendar}
    if set(sessions) != expected:
        raise ValueError(f"Archive covers {len(sessions)} of {len(expected)} requested sessions")

    def verify_day(entry):
        day = entry["date"]
        rows = sessions[day]["rows"]
        if len(rows) != 10 or len({row["security"] for row in rows}) != 10:
            raise ValueError(f"Expected ten distinct winners on {day}")
        if rows != sorted(rows, key=lambda row: (-row["gain"], row["symbol"])):
            raise ValueError(f"Unexpected rank order on {day}")
        window_start = datetime.fromisoformat(f"{day}T{entry['session_open']}").replace(tzinfo=eastern)
        window_end = datetime.fromisoformat(f"{day}T{entry['close']}").replace(tzinfo=eastern)
        page = get(backfill["DATA"], "/v2/stocks/bars",
                   symbols=",".join(row["symbol"] for row in rows), timeframe="1Min",
                   start=window_start.isoformat(), end=window_end.isoformat(),
                   feed="sip", adjustment="split", asof="-", limit=10000)
        if page["next_page_token"]:
            raise ValueError(f"Unexpected additional minute bars for {day}")
        for row in rows:
            bars = page["bars"].get(row["symbol"], [])
            prices = [bar["h"] for bar in bars if bar["n"] > 0
                      and window_start <= datetime.fromisoformat(bar["t"]) < window_end]
            peak = Decimal(str(row["sessionHigh"]))
            close = Decimal(str(row["close"]))
            previous_close = Decimal(str(row["previousClose"]))
            gain = Decimal(str(row["gain"]))
            if not prices or max(close, max(prices)) != peak:
                observed = max(prices, default=None)
                raise ValueError(f"Minute high mismatch for {row['symbol']} on {day}: "
                                 f"saved {peak}, minute {observed}, close {close}")
            expected_gain = (peak / previous_close - 1) * 100
            if expected_gain <= 0 or abs(expected_gain - gain) > Decimal("0.00000001"):
                raise ValueError(f"Gain mismatch for {row['symbol']} on {day}")

    with ThreadPoolExecutor(max_workers=6) as pool:
        for count, _ in enumerate(pool.map(verify_day, calendar), 1):
            if count % 50 == 0:
                print(f"Verified {count} sessions", flush=True)
    print(f"Verified all {len(sessions)} sessions and {10 * len(sessions)} session highs")


if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument("directory", type=Path)
    parser.add_argument("start", type=date.fromisoformat)
    parser.add_argument("end", type=date.fromisoformat)
    args = parser.parse_args()
    verify(args.directory, args.start, args.end)
