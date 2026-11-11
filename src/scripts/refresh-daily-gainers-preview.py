"""Refresh the private archive after the New York session has settled."""

import argparse
from datetime import datetime, time, timedelta
import json
from pathlib import Path
import runpy
import tempfile
from zoneinfo import ZoneInfo


SCRIPTS = Path(__file__).parent
backfill = runpy.run_path(str(SCRIPTS / "backfill-daily-gainers.py"))
renderer = runpy.run_path(str(SCRIPTS / "render-daily-gainers-preview.py"))
add_dollar_volume = runpy.run_path(str(SCRIPTS / "daily-gainers-dollar-volume.py"))["add_dollar_volume"]


def refresh(directory, preview, now):
    daily_path = directory / "daily.json"
    archive = json.loads(daily_path.read_text()) if daily_path.exists() else {"sessions": {}}
    # Run after 17:00 ET. Look back across weekends/holidays and refresh the
    # recent window to pick up late provider corrections and missed runs.
    end = now.date() - timedelta(days=now.time() < time(17))
    result = backfill["run"](end - timedelta(days=7), end)
    add_dollar_volume(result["sessions"], backfill["alpaca_reader"]())
    archive["sessions"].update(result["sessions"])
    archive["aliases"] = result["aliases"]
    backfill["write_json"](daily_path, archive)

    export_preview(directory, preview, archive)
    print(f"Refreshed {len(result['sessions'])} sessions; latest {max(archive['sessions'])}")


def export_preview(directory, preview, archive):
    daily_path = directory / "daily.json"
    sessions = {}
    for path in sorted(directory.glob("*.json")):
        if path != daily_path:
            sessions.update(json.loads(path.read_text())["sessions"])
    sessions.update(archive["sessions"])
    sessions = {day: row for day, row in sessions.items() if day >= renderer["FIRST_PREVIEW_DAY"]}
    dashboard = directory / "dashboard"
    dashboard.mkdir(exist_ok=True)
    backfill["write_json"](dashboard / "archive.json", {"sessions": sessions, "aliases": archive["aliases"]})
    renderer["export_site"](sessions, archive["aliases"], directory / "site")
    html = renderer["render"](sessions, archive["aliases"])
    with tempfile.NamedTemporaryFile(mode="w", dir=preview.parent, delete=False) as file:
        path = Path(file.name)
        try:
            file.write(html)
            file.close()
            path.replace(preview)
        finally:
            path.unlink(missing_ok=True)
    print(f"Preview archive: {len(sessions)} sessions; latest {max(sessions)}")


if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument("directory", type=Path)
    parser.add_argument("preview", type=Path)
    parser.add_argument("--render-only", action="store_true")
    args = parser.parse_args()
    if args.render_only:
        archive = json.loads((args.directory / "daily.json").read_text())
        export_preview(args.directory, args.preview, archive)
    else:
        refresh(args.directory, args.preview, datetime.now(ZoneInfo("America/New_York")))
