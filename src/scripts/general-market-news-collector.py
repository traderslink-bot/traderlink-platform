"""Inert by default. One bounded EODHD collector; activation is an operations gate.

No provider work occurs at import or without explicit --run. Secrets are read only
inside main's activated branch. Exceptions never print token-bearing URLs/payloads.
"""
import argparse
import datetime as dt
import fcntl
import hashlib
import hmac
import json
import os
from pathlib import Path
import resource
import sqlite3
import time
import urllib.error
import urllib.parse
import urllib.request
import uuid

UTC = dt.timezone.utc
MAX_RESPONSE = 4 * 1024 * 1024
MAX_BATCH = 512 * 1024
MAX_BODY = 64 * 1024
MAX_OUTBOX = 32 * 1024 * 1024
MAX_STORAGE = 256 * 1024 * 1024


class Deferred(Exception):
    """Safe diagnostic code only, never an underlying request URL or response."""


def iso(epoch):
    return dt.datetime.fromtimestamp(epoch, UTC).isoformat(timespec="milliseconds").replace("+00:00", "Z")


def signature(secret, timestamp, delivery_id, body):
    message = timestamp.encode() + b"\n" + delivery_id.encode() + b"\n" + body
    return hmac.new(secret.encode(), message, hashlib.sha256).hexdigest()


def http_transport(url, method="GET", headers=None, body=None, cap=MAX_RESPONSE):
    """No redirects: credentials must not be forwarded to an unexpected host."""
    class NoRedirect(urllib.request.HTTPRedirectHandler):
        def redirect_request(self, req, fp, code, msg, response_headers, newurl):
            return None
    try:
        request = urllib.request.Request(url, data=body, headers=headers or {}, method=method)
        with urllib.request.build_opener(NoRedirect).open(request, timeout=15) as response:
            payload = response.read(cap + 1)
            if len(payload) > cap:
                raise Deferred("oversize")
            return response.status, dict(response.headers), payload
    except urllib.error.HTTPError as error:
        # Never expose reason/message/body/full URL, including to callers.
        return error.code, dict(error.headers), b""
    except Deferred:
        raise
    except Exception:
        raise Deferred("transport_unavailable") from None


class Store:
    def __init__(self, path):
        self.db = sqlite3.connect(path)
        self.db.execute("PRAGMA journal_mode=WAL")
        self.db.execute("PRAGMA journal_size_limit=16777216")
        self.db.executescript("""
          CREATE TABLE IF NOT EXISTS state(key TEXT PRIMARY KEY,value TEXT NOT NULL);
          CREATE TABLE IF NOT EXISTS budget(day TEXT PRIMARY KEY,spent INTEGER NOT NULL);
          CREATE TABLE IF NOT EXISTS outbox(id TEXT PRIMARY KEY,body BLOB NOT NULL,created REAL NOT NULL);
          CREATE TABLE IF NOT EXISTS seen(id TEXT PRIMARY KEY,seen REAL NOT NULL);
        """)

    def get(self, key, fallback=None):
        row = self.db.execute("SELECT value FROM state WHERE key=?", (key,)).fetchone()
        return json.loads(row[0]) if row else fallback

    def set(self, key, value):
        self.db.execute("INSERT INTO state VALUES(?,?) ON CONFLICT(key) DO UPDATE SET value=excluded.value", (key, json.dumps(value)))

    def reserve(self, day, cap, cost=5):
        with self.db:
            self.db.execute("INSERT OR IGNORE INTO budget VALUES(?,0)", (day,))
            used = self.db.execute("SELECT spent FROM budget WHERE day=?", (day,)).fetchone()[0]
            if used + cost > cap:
                raise Deferred("news_daily_cap")
            self.db.execute("UPDATE budget SET spent=spent+? WHERE day=?", (cost, day))

    def backlog(self):
        return self.db.execute("SELECT count(*),coalesce(sum(length(body)),0) FROM outbox").fetchone()

    def enqueue(self, articles, collected_at, state, epoch, collection="general"):
        count, used = self.backlog()
        chunks, current = [], []
        def encode(items):
            return json.dumps(dict(version=1, collectedAt=collected_at, state=state, collection=collection, articles=items), ensure_ascii=False, separators=(",", ":")).encode()
        for article in articles:
            candidate = current + [article]
            if len(candidate) > 25 or len(encode(candidate)) > MAX_BATCH:
                chunks.append(encode(current)); current = [article]
            else:
                current = candidate
        if current or not chunks:
            chunks.append(encode(current))
        if count + len(chunks) > 1000 or used + sum(map(len, chunks)) > MAX_OUTBOX:
            raise Deferred("delivery_backlog")
        for body in chunks:
            if len(body) > MAX_BATCH:
                raise Deferred("oversize")
            self.db.execute("INSERT INTO outbox VALUES(?,?,?)", (str(uuid.uuid4()), body, epoch))

    def maintain(self, epoch):
        with self.db:
            self.db.execute("DELETE FROM seen WHERE seen<?", (epoch - 7 * 86400,))
            self.db.execute("DELETE FROM seen WHERE id IN (SELECT id FROM seen ORDER BY seen DESC,id LIMIT -1 OFFSET 20000)")
            self.db.execute("DELETE FROM budget WHERE day<?", ((dt.datetime.fromtimestamp(epoch, UTC) - dt.timedelta(days=7)).date().isoformat(),))
            # Offset/due keys are bounded by selected ticker population; old windows expire.
            for key, in self.db.execute("SELECT key FROM state WHERE key LIKE 'cursor:%'").fetchall():
                if key.rsplit(":", 1)[-1] < (dt.datetime.fromtimestamp(epoch, UTC) - dt.timedelta(days=3)).date().isoformat():
                    self.db.execute("DELETE FROM state WHERE key=?", (key,))
        self.db.execute("PRAGMA wal_checkpoint(PASSIVE)")
        page_count = self.db.execute("PRAGMA page_count").fetchone()[0]
        page_size = self.db.execute("PRAGMA page_size").fetchone()[0]
        if page_count * page_size > MAX_STORAGE:
            raise Deferred("storage_limit")


class Collector:
    def __init__(self, store, token, destination, secret, *, cap=70000, reserve=10000,
                 tickers=(), transport=http_transport, clock=time.time, sleep=time.sleep):
        self.store, self.token, self.destination, self.secret = store, token, destination, secret
        self.cap, self.reserve, self.tickers = cap, reserve, tuple(tickers)
        self.transport, self.clock, self.sleep = transport, clock, sleep
        self.last_request = 0

    def request(self, url, **kwargs):
        remaining = 1.1 - (self.clock() - self.last_request)
        if remaining > 0:
            self.sleep(remaining)
        self.last_request = self.clock()
        status, headers, body = self.transport(url, **kwargs)
        headers = {key.lower(): value for key, value in headers.items()}
        if status in (401, 403):
            raise Deferred("authentication_paused")
        if status in (402, 429):
            try:
                delay = min(86400, max(60, int(headers.get("retry-after", "60"))))
            except ValueError:
                delay = 60
            self.store.set("provider_retry_at", self.clock() + delay); self.store.db.commit()
            raise Deferred("provider_limit")
        if status < 200 or status >= 300:
            raise Deferred("request_unavailable")
        if headers.get("x-ratelimit-remaining", "100") == "0":
            self.store.set("provider_retry_at", self.clock() + 60); self.store.db.commit()
        return body

    def provider(self, endpoint, params, cap=MAX_RESPONSE):
        url = "https://eodhd.com/api/" + endpoint + "?" + urllib.parse.urlencode({**params, "api_token": self.token, "fmt": "json"})
        payload = self.request(url, cap=cap)
        try:
            return json.loads(payload)
        except (ValueError, UnicodeError):
            raise Deferred("invalid_provider_data") from None

    def news_page(self, params):
        now = self.clock()
        if now < self.store.get("provider_retry_at", 0):
            raise Deferred("provider_backoff")
        if self.store.backlog()[0] >= 975 or self.store.backlog()[1] >= MAX_OUTBOX - MAX_RESPONSE:
            raise Deferred("delivery_backlog")
        day = dt.datetime.fromtimestamp(now, UTC).date().isoformat()
        usage = self.provider("user", {}, cap=64 * 1024)
        try:
            used, limit = int(usage["apiRequests"]), int(usage["dailyRateLimit"])
            counter_day = dt.date.fromisoformat(str(usage["apiRequestsDate"])[:10]).isoformat()
            if counter_day > day or used < 0 or limit <= 0:
                raise ValueError()
            if counter_day < day:
                # Documented lazy reset: yesterday's count is not today's spend;
                # first chargeable request starts the new GMT budget.
                used = 0
        except (KeyError, TypeError, ValueError):
            raise Deferred("usage_unconfirmed") from None
        # Avoid rollover between quota observation/reservation and the news call.
        if dt.datetime.fromtimestamp(self.clock(), UTC).date().isoformat() != day:
            raise Deferred("day_rollover")
        if limit - used - 5 < self.reserve:
            raise Deferred("account_reserve")
        self.store.reserve(day, self.cap)
        return self.provider("news", params)

    def deliver(self):
        rows = self.store.db.execute("SELECT id,body FROM outbox ORDER BY created,id LIMIT 4").fetchall()
        for delivery_id, body in rows:
            timestamp = str(int(self.clock()))
            response = self.request(self.destination, method="POST", body=body, cap=4096, headers={
                "Content-Type": "application/json", "x-news-delivery-id": delivery_id,
                "x-news-timestamp": timestamp, "x-news-signature": signature(self.secret, timestamp, delivery_id, body)})
            try:
                acknowledged = json.loads(response)
            except ValueError:
                raise Deferred("delivery_unconfirmed") from None
            if acknowledged.get("ok") is not True or acknowledged.get("result") not in ("accepted", "duplicate"):
                raise Deferred("delivery_unconfirmed")
            with self.store.db:
                self.store.db.execute("DELETE FROM outbox WHERE id=?", (delivery_id,))

    def collect(self, ticker=None):
        now = self.clock(); today = dt.datetime.fromtimestamp(now, UTC).date()
        start = (today - dt.timedelta(days=1)).isoformat()
        key = "cursor:" + (ticker or "general") + ":" + today.isoformat()
        cursor = self.store.get(key, {"offset": 0, "limit": 100})
        hour = str(int(now // 3600)); paging = self.store.get("paging", {"hour": hour, "extra": 0})
        if paging["hour"] != hour:
            paging = {"hour": hour, "extra": 0}
        for page in range(3):
            if page and paging["extra"] >= 10:
                break
            if cursor["offset"] + cursor["limit"] > 10000:
                raise Deferred("window_backlog")
            params = dict(direction=1, **{"from": start, "to": today.isoformat()}, **cursor)
            if ticker:
                params["s"] = ticker
            try:
                raw = self.news_page(params)
            except Deferred as error:
                if str(error) == "oversize" and cursor["limit"] > 1:
                    cursor["limit"] = max(1, cursor["limit"] // 2)
                    self.store.set(key, cursor); self.store.db.commit()
                raise
            if not isinstance(raw, list) or len(raw) > cursor["limit"]:
                raise Deferred("invalid_provider_data")
            articles, fingerprints = [], []
            for row in raw:
                if not isinstance(row, dict) or not isinstance(row.get("title"), str) or not row["title"].strip():
                    raise Deferred("invalid_provider_article")
                # Retain original fields needed for normalization only. No raw request/account data.
                article = {field: row.get(field) for field in ("date", "title", "content", "link", "symbols", "tags")}
                body = article["content"] if isinstance(article["content"], str) else ""
                encoded = body.encode(); article["bodyTruncated"] = len(encoded) > MAX_BODY
                article["content"] = encoded[:MAX_BODY].decode("utf8", errors="ignore")
                article["collection"] = "ticker" if ticker else "general"
                fingerprint = hashlib.sha256(json.dumps(article, sort_keys=True).encode()).hexdigest()
                if not self.store.db.execute("SELECT 1 FROM seen WHERE id=?", (fingerprint,)).fetchone():
                    articles.append(article); fingerprints.append(fingerprint)
            partial = len(raw) == cursor["limit"]
            with self.store.db:
                self.store.enqueue(articles, iso(now), "partial" if partial else "fresh", now, "ticker" if ticker else "general")
                for fingerprint in fingerprints:
                    self.store.db.execute("INSERT OR REPLACE INTO seen VALUES(?,?)", (fingerprint, now))
                cursor["offset"] += len(raw)
                self.store.set(key, cursor)
                if page:
                    paging["extra"] += 1
                self.store.set("paging", paging)
            if not partial:
                break

    def cycle(self):
        if self.clock() >= self.store.get("maintenance_at", 0):
            self.store.maintain(self.clock())
            self.store.set("maintenance_at", self.clock() + 3600); self.store.db.commit()
        self.deliver()  # Recover delivery first, before spending more provider budget.
        # Spread first ticker refreshes across ten minutes, not one burst which
        # would delay general news. Subsequent cycles service at most one due
        # ticker; the general job always gets first priority.
        for index, ticker in enumerate(self.tickers):
            key = "due:" + ticker
            if self.store.get(key) is None:
                self.store.set(key, self.clock() + index * 600 / max(1, len(self.tickers)))
        self.store.db.commit()
        due = sorted(self.tickers, key=lambda ticker: self.store.get("due:" + ticker, 0))
        jobs = [(None, 60)] + [(ticker, 600) for ticker in due[:1]]
        for ticker, cadence in jobs:
            key = "due:" + (ticker or "general")
            if self.clock() >= self.store.get(key, 0):
                self.collect(ticker)
                self.store.set(key, self.clock() + cadence); self.store.db.commit()
                self.deliver()


def main():
    parser = argparse.ArgumentParser(description="Inert General Market News collector; explicit activation required.")
    parser.add_argument("--run", action="store_true")
    parser.add_argument("--once", action="store_true")
    parser.add_argument("--state", help="Dedicated non-repository collector SQLite path")
    args = parser.parse_args()
    if not args.run:
        print("Inactive. No credentials loaded or network requests made.")
        return
    if not args.state:
        parser.error("Explicit dedicated --state is required.")
    state = Path(args.state).resolve()
    if not state.is_absolute() or Path(__file__).resolve().parents[2] in state.parents:
        parser.error("State must be outside the source repository.")
    token = os.environ.get("EODHD_API_TOKEN", "")
    destination = os.environ.get("TRADERLINK_GENERAL_NEWS_INGEST_URL", "")
    secret = os.environ.get("TRADERLINK_GENERAL_NEWS_INGEST_SECRET", "")
    parsed = urllib.parse.urlsplit(destination)
    if not token or len(secret) < 32 or parsed.scheme != "https" or not parsed.hostname or parsed.username or parsed.password or parsed.query or parsed.fragment or parsed.path != "/api/market-news/general/ingest":
        parser.error("Collector configuration is incomplete or invalid.")
    cap = int(os.environ.get("TRADERLINK_GENERAL_NEWS_DAILY_CAP", "70000"))
    if not 5 <= cap <= 80000:
        parser.error("Daily news cap must be between 5 and 80000.")
    import re
    tickers = list(dict.fromkeys(s.strip().upper() for s in os.environ.get("TRADERLINK_GENERAL_NEWS_TICKERS", "").split(",") if s.strip()))
    if len(tickers) > 90 or any(not re.fullmatch(r"[A-Z0-9][A-Z0-9.\-]{0,30}\.US", s) for s in tickers):
        parser.error("Ticker list must contain at most 90 qualified US symbols.")
    resource.setrlimit(resource.RLIMIT_AS, (256 * 1024 * 1024, 256 * 1024 * 1024))
    os.umask(0o077); state.parent.mkdir(parents=True, exist_ok=True)
    with open(str(state) + ".lock", "a") as lock:
        try:
            fcntl.flock(lock, fcntl.LOCK_EX | fcntl.LOCK_NB)
        except BlockingIOError:
            raise SystemExit("Collector already active.") from None
        store = Store(state)
        collector = Collector(store, token, destination, secret, cap=cap, tickers=tickers)
        failures = 0
        try:
            while True:
                try:
                    collector.cycle(); failures = 0
                except Deferred as error:
                    print("Collection deferred:", str(error), flush=True); failures += 1
                    if str(error) == "authentication_paused":
                        break
                except Exception:
                    # Fail closed without secret-bearing traceback or uncontrolled restart loop.
                    print("Collection paused: unexpected failure.", flush=True)
                    break
                if args.once:
                    break
                time.sleep(min(3600, 60 * 2 ** min(failures, 6)) if failures else 1)
        finally:
            store.db.close()


if __name__ == "__main__":
    main()
