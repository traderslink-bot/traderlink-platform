"""Render the private gainers hub and its crawlable day and month pages."""

import argparse
from datetime import date
from html import escape
import json
from pathlib import Path

FIRST_PREVIEW_DAY = "2025-01-01"
CANONICAL_BASE = "https://traderslink.pro/stock-gainers/"
COLUMNS = ("Rank", "Ticker", "Close", "Gain", "Dollar volume")


def label(day, month=False):
    return date.fromisoformat(day).strftime("%B %Y" if month else "%B %d, %Y")


def volume_label(amount):
    if amount is None:
        return "—"
    for divisor, suffix in ((10**9, "B"), (10**6, "M"), (10**3, "K")):
        if amount >= divisor:
            return f"${amount / divisor:.1f}".removesuffix(".0") + suffix
    return f"${amount:,}"


def table(session):
    headings = "".join(f'<th scope="col">{heading}</th>' for heading in COLUMNS)
    rows = "".join(
        f'<tr><td>{index}</td><th scope="row">{escape(row["symbol"])}</th>'
        f'<td>${row["close"]:,.2f}</td><td class="gainers-gain">+{row["gain"]:,.2f}%</td>'
        f'<td>{volume_label(row.get("dollarVolume"))}</td></tr>'
        for index, row in enumerate(session["rows"], 1)
    )
    return f"<table><thead><tr>{headings}</tr></thead><tbody>{rows}</tbody></table>"


def group_months(days):
    months = {}
    for day in sorted(days, reverse=True):
        months.setdefault(day[:7], []).append(day)
    return months


def html_json(value):
    return json.dumps(value, separators=(",", ":")).replace("<", r"\u003c")


def render(sessions, aliases, site=False):
    template = Path(__file__).with_name("daily-gainers-preview.html").read_text()
    days = sorted(sessions, reverse=True)

    def session_link(day):
        if site:
            return f'<a href="./{day}/">{label(day)}</a>'
        return f'<a href="#session-{day}" data-session="{day}">{label(day)}</a>'

    recent = [
        f'<article><h3>{session_link(day)}</h3>{table(sessions[day])}</article>'
        for day in days[:5]
    ]
    months = []
    for month, dates in group_months(days).items():
        href = f"./month/{month}/" if site else f"#session-{dates[0]}"
        data = "" if site else f' data-session="{dates[0]}" data-month="true"'
        months.append(f'<li><a href="{href}"{data}>{label(dates[0], month=True)}</a></li>')
    compact = {}
    for day, result in sessions.items():
        rows = []
        for entry in result["rows"]:
            symbol = entry["symbol"]
            row = [symbol, entry["close"], entry["gain"], entry.get("dollarVolume")]
            if entry.get("security", symbol) != symbol:
                row.append(entry["security"])
            rows.append(row)
        compact[day] = [result["compared"], rows]
    return (template.replace("__RECENT_SESSIONS__", "".join(recent))
            .replace("__GAINERS_MONTHS__", "".join(months))
            .replace("__GAINERS_DATA__", html_json(compact))
            .replace("__GAINERS_ALIASES__", html_json(aliases))
            .replace("__GAINERS_LINK_MODE__", "site" if site else "inline"))


def document(title, description, path, body, *, indexable=False):
    robots = "index,follow" if indexable else "noindex,nofollow"
    return f"""<!doctype html>
<html lang="en"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<meta name="robots" content="{robots}">
<title>{escape(title)}</title>
<meta name="description" content="{escape(description, quote=True)}">
<link rel="canonical" href="{CANONICAL_BASE}{path}">
<style>
body {{ font: 16px/1.5 system-ui,sans-serif; color: #17283e; max-width: 70rem; margin: auto; padding: 1rem; }}
nav {{ display: flex; flex-wrap: wrap; gap: 1rem; }}
table {{ border-collapse: collapse; width: 100%; font-variant-numeric: tabular-nums; }}
th, td {{ padding: .5rem .25rem; border-bottom: 1px solid #e1e7ef; text-align: left; }}
@media(max-width: 380px) {{ table {{ font-size: 13px; }} }}
</style>
</head><body>{body}</body></html>
"""


def write_page(root, path, contents):
    directory = root / path
    directory.mkdir(parents=True, exist_ok=True)
    output = directory / "index.html"
    temporary = directory / ".index.html.tmp"
    temporary.write_text(contents)
    temporary.replace(output)


def export_site(sessions, aliases, root, *, indexable=False):
    days = sorted(sessions, reverse=True)
    months = group_months(days)
    for position, day in enumerate(days):
        session = sessions[day]
        title = f"Top Stock Gainers for {label(day)}"
        leader = session["rows"][0]
        description = (f'{leader["symbol"]} led the Alpaca-covered U.S. gainers on {label(day)}. '
                       'See all 10 stocks, their gains, closes and dollar volume.')
        navigation = ['<a href="../">Stock gainers hub</a>',
                      f'<a href="../month/{day[:7]}/">{label(day, month=True)} archive</a>']
        if position + 1 < len(days):
            navigation.append(f'<a href="../{days[position + 1]}/">Previous trading day</a>')
        if position:
            navigation.append(f'<a href="../{days[position - 1]}/">Next trading day</a>')
        body = (
            f'<nav aria-label="Trading dates">{"".join(navigation)}</nav><main><h1>{title}</h1>'
            f'<p>{session["compared"]:,} stocks compared · Alpaca SIP · Split-adjusted close-to-close</p>'
            f'{table(session)}<p>Estimated dollar volume uses unadjusted volume and VWAP.</p></main>'
        )
        write_page(root, day, document(title, description, f"{day}/", body, indexable=indexable))
    for month, dates in months.items():
        title = f"Daily Stock Gainers for {label(dates[0], month=True)}"
        entries = "".join(
            f'<li><a href="../../{day}/">{label(day)}</a> · '
            f'{escape(sessions[day]["rows"][0]["symbol"])} led the session</li>' for day in dates
        )
        body = f'<nav><a href="../../">Stock gainers hub</a></nav><main><h1>{title}</h1><ul>{entries}</ul></main>'
        write_page(root, f"month/{month}", document(title, "Browse the top 10 stocks for each trading day.", f"month/{month}/", body, indexable=indexable))
    write_page(root, "", document("Top Stock Gainers and Daily Rankings",
                                   "See the top 10 U.S. stock gainers after the close, including small-cap and micro-cap movers. Browse historical rankings and find repeat movers by ticker.",
                                   "", render(sessions, aliases, site=True), indexable=indexable))
    paths = ["", *(f"{day}/" for day in days), *(f"month/{month}/" for month in months)]
    xml = "".join(f"<url><loc>{CANONICAL_BASE}{path}</loc></url>" for path in paths)
    temporary = root / ".sitemap.xml.tmp"
    temporary.write_text(f'<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">{xml}</urlset>')
    temporary.replace(root / "sitemap.xml")


if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument("output", type=Path)
    parser.add_argument("archives", type=Path, nargs="+")
    parser.add_argument("--site", type=Path)
    args = parser.parse_args()
    sessions = {}
    aliases = {}
    for archive in args.archives:
        data = json.loads(archive.read_text())
        sessions.update((day, row) for day, row in data["sessions"].items() if day >= FIRST_PREVIEW_DAY)
        aliases.update(data.get("aliases", {}))
    if not sessions:
        parser.error("at least one ranked trading session is required")
    args.output.write_text(render(sessions, aliases))
    if args.site:
        export_site(sessions, aliases, args.site)
