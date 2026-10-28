"""Synthetic acceptance fixtures. No test or feature module has run during authoring."""
import importlib.util
import json
from pathlib import Path
import tempfile
import unittest

spec = importlib.util.spec_from_file_location("general_news_collector", Path(__file__).with_name("general-market-news-collector.py"))
module = importlib.util.module_from_spec(spec)
spec.loader.exec_module(module)


class CollectorTests(unittest.TestCase):
    def setUp(self):
        self.temp = tempfile.TemporaryDirectory()
        self.store = module.Store(Path(self.temp.name) / "synthetic.sqlite")
        self.now = 1793210400.0  # Synthetic fixed GMT date, never a real account.
        self.calls = []
        self.news = []
        self.used = 3735

        def transport(url, **kwargs):
            self.calls.append((url, kwargs))
            if "/user?" in url:
                return 200, {}, json.dumps({"apiRequests": self.used, "apiRequestsDate": module.iso(self.now)[:10], "dailyRateLimit": 100000}).encode()
            if "/news?" in url:
                self.used += 5
                return 200, {}, json.dumps(self.news).encode()
            return 200, {}, b'{"ok":true,"result":"accepted"}'

        self.collector = module.Collector(self.store, "fake-token", "https://example.com/api/market-news/general/ingest", "synthetic-secret-32-characters-long", transport=transport, clock=lambda: self.now, sleep=lambda _: None)

    def tearDown(self):
        self.store.db.close()
        self.temp.cleanup()

    def test_shared_total_reserve_and_local_daily_cap(self):
        self.used = 89996
        with self.assertRaisesRegex(module.Deferred, "account_reserve"):
            self.collector.news_page({})
        self.assertEqual(len(self.calls), 1)
        self.used = 3735
        self.collector.cap = 5
        self.collector.news_page({})
        with self.assertRaisesRegex(module.Deferred, "news_daily_cap"):
            self.collector.news_page({})
        self.assertEqual(sum("/news?" in call[0] for call in self.calls), 1)

    def test_reservation_survives_timeout_and_restart(self):
        original = self.collector.transport

        def failing(url, **kwargs):
            if "/news?" in url:
                raise module.Deferred("transport_unavailable")
            return original(url, **kwargs)

        self.collector.transport = failing
        self.collector.cap = 5
        with self.assertRaises(module.Deferred):
            self.collector.news_page({})
        with self.assertRaisesRegex(module.Deferred, "news_daily_cap"):
            self.collector.news_page({})
        self.store.db.close()
        self.store = module.Store(Path(self.temp.name) / "synthetic.sqlite")
        self.assertEqual(self.store.db.execute("SELECT spent FROM budget").fetchone()[0], 5)

    def test_arrival_cursor_dedup_and_signed_durable_delivery(self):
        self.news = [{"title": "Synthetic story", "date": module.iso(self.now), "link": "https://example.com/story", "content": "Text", "symbols": [], "tags": []}]
        self.collector.collect()
        self.assertEqual(self.store.backlog()[0], 1)
        self.collector.deliver()
        self.assertEqual(self.store.backlog()[0], 0)
        sent = [call for call in self.calls if call[1].get("method") == "POST"][0][1]
        headers = sent["headers"]
        self.assertEqual(headers["x-news-signature"], module.signature(self.collector.secret, headers["x-news-timestamp"], headers["x-news-delivery-id"], sent["body"]))
        self.assertEqual(json.loads(sent["body"])["articles"][0]["symbols"], [])
        self.collector.collect()
        row = self.store.db.execute("SELECT body FROM outbox").fetchone()
        self.assertEqual(json.loads(row[0])["articles"], [])
        self.assertTrue(any("offset=1" in url for url, _ in self.calls))

    def test_delivery_failure_keeps_outbox_and_cursor(self):
        self.news = [{"title": "Fixture", "link": "https://example.com/a", "date": module.iso(self.now)}]
        self.collector.collect()
        self.collector.transport = lambda *_, **__: (503, {}, b"")
        with self.assertRaises(module.Deferred):
            self.collector.deliver()
        self.assertEqual(self.store.backlog()[0], 1)

    def test_per_day_budget_and_full_page_extra_page_bound(self):
        day = module.iso(self.now)[:10]
        self.store.reserve(day, 5)
        with self.assertRaises(module.Deferred):
            self.store.reserve(day, 5)
        tomorrow = module.iso(self.now + 86400)[:10]
        self.store.reserve(tomorrow, 5)
        self.news = [{"title": f"Fixture {i}", "date": module.iso(self.now), "link": f"https://example.com/{i}"} for i in range(100)]
        self.collector.collect()
        self.assertEqual(sum("/news?" in url for url, _ in self.calls), 3)
        self.assertLessEqual(self.store.get("paging")["extra"], 10)
        self.assertTrue(all(json.loads(body)["state"] == "partial" for body, in self.store.db.execute("SELECT body FROM outbox")))

    def test_malformed_usage_never_dispatches_news(self):
        self.collector.transport = lambda *_, **__: (200, {}, b'{"apiRequests":"private"}')
        with self.assertRaisesRegex(module.Deferred, "usage_unconfirmed"):
            self.collector.news_page({})

    def test_rejects_oversized_outbox_without_advancing_cursor(self):
        original = module.MAX_OUTBOX
        module.MAX_OUTBOX = 1
        try:
            with self.assertRaisesRegex(module.Deferred, "delivery_backlog"):
                self.collector.collect()
            self.assertEqual(self.store.db.execute("SELECT count(*) FROM state WHERE key LIKE 'cursor:%'").fetchone()[0], 0)
        finally:
            module.MAX_OUTBOX = original


if __name__ == "__main__":
    unittest.main()
