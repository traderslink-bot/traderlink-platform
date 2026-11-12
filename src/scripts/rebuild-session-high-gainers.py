"""Rebuild an isolated max-gain archive in resumable calendar-month batches."""

import argparse
from calendar import monthrange
from concurrent.futures import ThreadPoolExecutor
from datetime import date, timedelta
import json
from pathlib import Path
import runpy


SCRIPTS = Path(__file__).parent
backfill = runpy.run_path(str(SCRIPTS / "backfill-daily-gainers.py"))
add_dollar_volume = runpy.run_path(str(SCRIPTS / "daily-gainers-dollar-volume.py"))["add_dollar_volume"]
add_display_prices = runpy.run_path(str(SCRIPTS / "daily-gainers-display-prices.py"))["add_display_prices"]


def rebuild(directory, start, end):
    directory.mkdir(mode=0o700, exist_ok=True)
    periods = []
    while start <= end:
        last = min(end, start.replace(day=monthrange(start.year, start.month)[1]))
        periods.append((start, last))
        start = last + timedelta(days=1)

    def batch(period):
        first, last = period
        output = directory / f"{first}_{last}.json"
        if output.exists():
            result = json.loads(output.read_text())
            if result.get("rankingMethod") != "session-high":
                raise ValueError(f"Invalid checkpoint: {output.name}")
        else:
            result = backfill["run"](first, last, session_high=True)
            get = backfill["alpaca_reader"]()
            add_dollar_volume(result["sessions"], get)
            add_display_prices(result["sessions"], get)
            backfill["write_json"](output, result)
        print(f"{first} through {last}: {len(result['sessions'])} sessions", flush=True)
        return result["aliases"]

    with ThreadPoolExecutor(max_workers=8) as pool:
        aliases = list(pool.map(batch, periods))[-1]
    daily = directory / "daily.json"
    if not daily.exists():
        backfill["write_json"](daily, {"rankingMethod": "session-high", "sessions": {}, "aliases": aliases})


if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument("directory", type=Path)
    parser.add_argument("start", type=date.fromisoformat)
    parser.add_argument("end", type=date.fromisoformat)
    args = parser.parse_args()
    if args.start > args.end:
        parser.error("start must be on or before end")
    rebuild(args.directory, args.start, args.end)
