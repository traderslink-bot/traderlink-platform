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


def read_daily(directory):
    path = directory / "daily.json"
    return json.loads(path.read_text()) if path.exists() else {"sessions": {}}


def merged_sessions(directory, archive):
    sessions = {}
    method = archive.get("rankingMethod", "close-to-close")
    for path in sorted(directory.glob("*.json")):
        if path.name == "daily.json":
            continue
        batch = json.loads(path.read_text())
        if batch.get("rankingMethod", "close-to-close") != method:
            raise ValueError(f"Ranking method mismatch in {path.name}")
        sessions.update(batch["sessions"])
    sessions.update(archive["sessions"])
    return {day: row for day, row in sessions.items() if day >= renderer["FIRST_PREVIEW_DAY"]}


def refresh(directory, preview, now, *, session_high=False):
    daily_path = directory / "daily.json"
    archive = read_daily(directory)
    method = "session-high" if session_high else "close-to-close"
    if archive.get("rankingMethod", "close-to-close") != method:
        raise ValueError("Select the ranking method for the archive directory")
    merged_sessions(directory, archive)
    # Run after 17:00 ET. Look back across weekends/holidays and refresh the
    # recent window to pick up late provider corrections and missed runs.
    end = now.date() - timedelta(days=now.time() < time(17))
    start = end - timedelta(days=7)
    result = backfill["run"](start, end, session_high=session_high)
    get = backfill["alpaca_reader"]()
    if session_high:
        verify_rows = runpy.run_path(str(SCRIPTS / "verify-session-high-gainers.py"))["verify_rows"]
        calendar = get(backfill["CALENDAR"], "/v2/calendar", start=start, end=end)
        verify_rows(result["sessions"], calendar, get)
    add_dollar_volume(result["sessions"], get)
    if session_high:
        add_display_prices = runpy.run_path(str(SCRIPTS / "daily-gainers-display-prices.py"))["add_display_prices"]
        add_display_prices(result["sessions"], get)
    archive["sessions"].update(result["sessions"])
    archive["aliases"] = result["aliases"]
    archive["rankingMethod"] = method
    backfill["write_json"](daily_path, archive)

    export_preview(directory, preview, archive)
    print(f"Refreshed {len(result['sessions'])} sessions; latest {max(archive['sessions'])}")


def export_preview(directory, preview, archive):
    sessions = merged_sessions(directory, archive)
    method = renderer["ranking_method"](sessions)
    if method != archive.get("rankingMethod", "close-to-close"):
        raise ValueError("Snapshot rows do not match the selected ranking method")
    dashboard = directory / "dashboard"
    dashboard.mkdir(exist_ok=True)
    backfill["write_json"](dashboard / "archive.json", {"sessions": sessions, "aliases": archive["aliases"], "rankingMethod": method})
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
    parser.add_argument("--session-high", action="store_true")
    args = parser.parse_args()
    if args.render_only:
        archive = json.loads((args.directory / "daily.json").read_text())
        export_preview(args.directory, args.preview, archive)
    else:
        refresh(args.directory, args.preview, datetime.now(ZoneInfo("America/New_York")),
                session_high=args.session_high)
