"""Export both hosted surfaces from one saved archive, without network access."""

import argparse
import hashlib
import json
from pathlib import Path
import runpy
from xml.etree import ElementTree

renderer = runpy.run_path(str(Path(__file__).with_name("render-daily-gainers-preview.py")))


def export(snapshot, output):
    snapshot_bytes = snapshot.read_bytes()
    archive = json.loads(snapshot_bytes)
    sessions = archive["sessions"]
    dates = sorted(sessions)
    if not dates or any(len(session["rows"]) != 10 for session in sessions.values()):
        raise ValueError("Release snapshot must have ten ranked entries per session")
    output.mkdir(mode=0o700, exist_ok=False)
    dashboard = output / "dashboard"
    dashboard.mkdir(mode=0o700)
    (dashboard / "archive.json").write_bytes(snapshot_bytes)
    site = output / "static" / "stock-gainers"
    renderer["export_site"](sessions, archive["aliases"], site, indexable=True)

    pages = sorted(site.rglob("index.html"))
    months = {day[:7] for day in dates}
    sitemap = ElementTree.parse(site / "sitemap.xml")
    if len(pages) != 1 + len(dates) + len(months) or len(sitemap.getroot()) != len(pages):
        raise ValueError("Unexpected public page or sitemap count")
    if any('<meta name="robots" content="index,follow">' not in page.read_text() for page in pages):
        raise ValueError("Public release contains a page without index,follow")

    files = {
        path.relative_to(output).as_posix(): hashlib.sha256(path.read_bytes()).hexdigest()
        for path in sorted(output.rglob("*")) if path.is_file()
    }
    manifest = {
        "firstSession": dates[0], "lastSession": dates[-1],
        "sessions": len(dates), "rankedRows": len(dates) * 10, "months": len(months),
        "publicPages": len(pages), "sha256": files,
    }
    (output / "manifest.json").write_text(json.dumps(manifest, indent=2) + "\n")
    return manifest


if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument("snapshot", type=Path)
    parser.add_argument("output", type=Path)
    args = parser.parse_args()
    manifest = export(args.snapshot, args.output)
    print(f"{manifest['sessions']} sessions through {manifest['lastSession']}; "
          f"{manifest['publicPages']} indexable public pages")
