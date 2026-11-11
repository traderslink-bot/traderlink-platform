"""Add dollar volume to a bounded portion of the private saved archive."""

import argparse
from datetime import date
import json
from pathlib import Path
import runpy

SCRIPTS = Path(__file__).parent
add_dollar_volume = runpy.run_path(str(SCRIPTS / "daily-gainers-dollar-volume.py"))["add_dollar_volume"]
backfill = runpy.run_path(str(SCRIPTS / "backfill-daily-gainers.py"))

parser = argparse.ArgumentParser()
parser.add_argument("start", type=date.fromisoformat)
parser.add_argument("archives", type=Path, nargs="+")
args = parser.parse_args()

for path in args.archives:
    archive = json.loads(path.read_text())
    sessions = {day: result for day, result in archive["sessions"].items() if day >= args.start.isoformat()}
    if sessions:
        add_dollar_volume(sessions, backfill["alpaca_reader"]())
        backfill["write_json"](path, archive)
        rows = [row for result in sessions.values() for row in result["rows"]]
        print(f"{path.name}: {sum(row['dollarVolume'] is not None for row in rows)}/{len(rows)} rows enriched", flush=True)
