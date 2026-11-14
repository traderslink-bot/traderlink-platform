"""Render the private gainers hub and its crawlable day and month pages."""

import argparse
import base64
import gzip
from datetime import date
from html import escape
import json
from pathlib import Path

FIRST_PREVIEW_DAY = "2020-01-01"
CANONICAL_BASE = "https://traderslink.pro/stock-gainers/"
COLUMNS = ("Rank", "Ticker", "Close", "Gain")
VOLUME_HELP = "Estimated dollars traded (share volume × volume-weighted average price). This total can include postmarket trades."
VOLUME_HEADING = (
    '<th scope="col"><span class="gainers-volume-label">$Vol'
    '<details class="gainers-volume-help"><summary aria-label="About dollar volume">ⓘ</summary>'
    f'<span class="gainers-volume-tip">{VOLUME_HELP}</span></details></span></th>'
)
VOLUME_STYLES = """
.gainers-volume-label { display: inline-flex; align-items: center; gap: 3px; white-space: nowrap; }
.gainers-volume-help { position: relative; display: inline-block; }
.gainers-volume-help summary { list-style: none; cursor: pointer; line-height: 1; padding: 3px; }
.gainers-volume-help summary::-webkit-details-marker { display: none; }
.gainers-volume-tip {
    position: absolute; z-index: 2; top: 100%; right: 0; width: min(210px, 60vw);
    padding: 8px; border-radius: 6px; text-align: left; font: 400 12px/1.4 system-ui, sans-serif;
    white-space: normal; background: #17283e; color: #fff;
}
"""
TABLE_SCROLL_STYLES = """
.gainers-table-scroll { max-width: 100%; min-width: 0; overflow-x: auto; }
.gainers-table-scroll table { min-width: 390px; }
.gainers-table-scroll :is(th, td) { white-space: nowrap; }
#gainers-results-scroll table { min-width: 510px; }
"""
MAX_GAIN_NOTE = (
    "Max gain is the percentage increase from the previous regular-session close to the session high. "
    "The session high includes premarket and regular-session trading. Postmarket prices are excluded."
)


def label(day, month=False):
    return date.fromisoformat(day).strftime("%B %Y" if month else "%B %d, %Y")


def volume_label(amount):
    if amount is None:
        return "—"
    for divisor, suffix in ((10**9, "B"), (10**6, "M"), (10**3, "K")):
        if amount >= divisor:
            return f"${amount / divisor:.1f}".removesuffix(".0") + suffix
    return f"${amount:,}"


def ranking_method(sessions):
    methods = {"session-high" if "sessionHigh" in row else "close-to-close"
               for session in sessions.values() for row in session["rows"]}
    if len(methods) != 1:
        raise ValueError("Expected a nonempty archive using a single ranking method")
    return methods.pop()


def table(session):
    max_gain = "sessionHigh" in session["rows"][0]
    columns = ("Rank", "Ticker", "High", "Close", "Max gain") if max_gain else COLUMNS
    headings = "".join(f'<th scope="col">{heading}</th>' for heading in columns) + VOLUME_HEADING
    rows = "".join(
        f'<tr><td>{index}</td><th scope="row">{escape(row["symbol"])}</th>'
        + (f'<td>${row.get("displayHigh", row["sessionHigh"]):,.2f}</td>' if max_gain else "")
        + f'<td>${row.get("displayClose", row["close"]):,.2f}</td><td class="gainers-gain">+{row["gain"]:,.2f}%</td>'
        f'<td>{volume_label(row.get("dollarVolume"))}</td></tr>'
        for index, row in enumerate(session["rows"], 1)
    )
    return (f'<div class="gainers-table-scroll" tabindex="0" role="region" aria-label="Daily gainers table">'
            f"<table><thead><tr>{headings}</tr></thead><tbody>{rows}</tbody></table></div>")


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
    session_high = ranking_method(sessions) == "session-high"

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
            row = [symbol, entry.get("displayClose", entry["close"]), entry["gain"], entry.get("dollarVolume")]
            if session_high:
                row.extend([entry.get("security", symbol), entry.get("displayHigh", entry["sessionHigh"])])
            elif entry.get("security", symbol) != symbol:
                row.append(entry["security"])
            rows.append(row)
        compact[day] = [result["compared"], rows]
    method_note = f'<p class="gainers-method"><em>{MAX_GAIN_NOTE}</em></p>' if session_high else ""
    data = html_json(compact)
    if not site:
        data = base64.b64encode(gzip.compress(data.encode("utf-8"), mtime=0)).decode("ascii")
    return (template.replace("__RECENT_SESSIONS__", "".join(recent))
            .replace("__GAINERS_METHOD_NOTE__", method_note)
            .replace("__GAINERS_VOLUME_HEADING__", VOLUME_HEADING)
            .replace("__GAINERS_VOLUME_STYLES__", VOLUME_STYLES + TABLE_SCROLL_STYLES)
            .replace("__GAINERS_HIGH_COLUMN__", '<th scope="col">High</th>' if session_high else "")
            .replace("__GAINERS_GAIN_LABEL__", "Max gain" if session_high else "Gain")
            .replace("__GAINERS_MONTHS__", "".join(months))
            .replace("__GAINERS_DATA__", data)
            .replace("__GAINERS_DATA_ENCODING__", "" if site else ' data-encoding="gzip"')
            .replace("__GAINERS_ALIASES__", html_json(aliases))
            .replace("__GAINERS_LINK_MODE__", "site" if site else "inline"))


def document(title, description, path, body, *, indexable=False):
    robots = "index,follow" if indexable else "noindex,nofollow"
    navigation = Path(__file__).with_name("daily-gainers-public-nav.html").read_text()
    return f"""<!doctype html>
<html lang="en"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<meta name="robots" content="{robots}">
<title>{escape(title)}</title>
<meta name="description" content="{escape(description, quote=True)}">
<link rel="canonical" href="{CANONICAL_BASE}{path}">
<style>
{VOLUME_STYLES}{TABLE_SCROLL_STYLES}
body {{ font: 16px/1.5 system-ui,sans-serif; color: #17283e; margin: 0; }}
.gainers-page-content {{ max-width: 70rem; margin: auto; padding: 1rem; }}
.gainers-page-content nav {{ display: flex; flex-wrap: wrap; gap: 1rem; }}
table {{ border-collapse: collapse; width: 100%; font-variant-numeric: tabular-nums; }}
th, td {{ padding: .5rem .25rem; border-bottom: 1px solid #e1e7ef; text-align: left; }}
@media(max-width: 380px) {{ table {{ font-size: 13px; }} }}
</style>
</head><body>{navigation}<div class="gainers-page-content">{body}</div></body></html>
"""


def write_page(root, path, contents):
    directory = root / path
    directory.mkdir(parents=True, exist_ok=True)
    output = directory / "index.html"
    temporary = directory / ".index.html.tmp"
    temporary.write_text(contents)
    temporary.replace(output)


def site_page(sessions, aliases, path, *, indexable=False):
    days = sorted(sessions, reverse=True)
    months = group_months(days)
    session_high = ranking_method(sessions) == "session-high"
    method = "Split-adjusted max gain" if session_high else "Split-adjusted close-to-close"
    method_note = f"<p><small><em>{MAX_GAIN_NOTE}</em></small></p>" if session_high else ""
    if path == "sitemap.xml":
        paths = ["", *(f"{day}/" for day in days), *(f"month/{month}/" for month in months)]
        xml = "".join(f"<url><loc>{CANONICAL_BASE}{item}</loc></url>" for item in paths)
        return f'<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">{xml}</urlset>'
    if path in sessions:
        day = path
        position = days.index(day)
        session = sessions[day]
        title = f"Top Stock Gainers for {label(day)}"
        leader = session["rows"][0]
        description = (f'{leader["symbol"]} led the Alpaca-covered U.S. gainers on {label(day)}. ' +
                       ('See all 10 stocks, their session highs, closes, max gains and dollar volume.' if session_high
                        else 'See all 10 stocks, their gains, closes and dollar volume.'))
        navigation = ['<a href="../">Stock gainers hub</a>',
                      f'<a href="../month/{day[:7]}/">{label(day, month=True)} archive</a>']
        if position + 1 < len(days):
            navigation.append(f'<a href="../{days[position + 1]}/">Previous trading day</a>')
        if position:
            navigation.append(f'<a href="../{days[position - 1]}/">Next trading day</a>')
        body = (
            f'<nav aria-label="Trading dates">{"".join(navigation)}</nav><main><h1>{title}</h1>'
            f'<p>{session["compared"]:,} stocks compared · Alpaca SIP · {method}</p>'
            f'{method_note}{table(session)}<p>Estimated dollar volume uses unadjusted volume and VWAP.</p></main>'
        )
        return document(title, description, f"{day}/", body, indexable=indexable)
    if path.startswith("month/") and path[6:] in months:
        month = path[6:]
        dates = months[month]
        title = f"Daily Stock Gainers for {label(dates[0], month=True)}"
        entries = "".join(
            f'<li><a href="../../{day}/">{label(day)}</a> · '
            f'{escape(sessions[day]["rows"][0]["symbol"])} led the session</li>' for day in dates
        )
        body = f'<nav><a href="../../">Stock gainers hub</a></nav><main><h1>{title}</h1><ul>{entries}</ul></main>'
        return document(title, "Browse the top 10 stocks for each trading day.", f"month/{month}/", body, indexable=indexable)
    if path == "":
        return document("Top Stock Gainers and Daily Rankings",
                                   "See the top 10 U.S. stock gainers after the close, including small-cap and micro-cap movers. Browse historical rankings and find repeat movers by ticker.",
                                   "", render(sessions, aliases, site=True), indexable=indexable)
    return None


def export_site(sessions, aliases, root, *, indexable=False):
    for path in ["", *sorted(sessions, reverse=True), *(f"month/{month}" for month in group_months(sessions))]:
        write_page(root, path, site_page(sessions, aliases, path, indexable=indexable))
    temporary = root / ".sitemap.xml.tmp"
    temporary.write_text(site_page(sessions, aliases, "sitemap.xml", indexable=indexable))
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
