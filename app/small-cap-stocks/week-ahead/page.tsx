import type { Metadata } from "next";
import Link from "next/link";

import { SiteShell } from "@/src/components/site/site-shell";
import {
  getPublicCatalystArticleDate,
  getPublicCatalystArticleExcerpt,
  getPublicCatalystArticleTitle,
  listBigTimePennyArticles,
} from "@/src/lib/news/big-time-pennies-store";

export const runtime = "nodejs";

export const metadata: Metadata = {
  alternates: {
    canonical: "/small-cap-stocks/week-ahead",
  },
  description:
    "Trader-focused weekly small-cap catalyst articles from TradersLink.",
  title: "Weekly Catalyst Articles | TradersLink News",
};

export default function BigTimePennyArticlesPage() {
  const articles = listBigTimePennyArticles();

  return (
    <SiteShell shellElement="div">
      <main className="academy-container news-ticker-page">
        <section className="academy-hero">
          <div className="academy-hero-copy">
            <p className="academy-eyebrow">Catalyst Watch</p>
            <h1 className="academy-title-sm">Weekly Small-Cap Catalyst Articles</h1>
            <p className="academy-lede">
              Trader-focused calendars for small-cap conferences, presentations,
              regulatory dates, and company events worth tracking.
            </p>
          </div>
        </section>

        <section className="academy-section">
          <div className="academy-section-heading">
            <div>
              <p className="academy-eyebrow">Published Articles</p>
              <h2 className="academy-section-title">Latest catalyst articles</h2>
            </div>
          </div>

          {articles.length > 0 ? (
            <div className="news-article-list">
              {articles.map((article) => (
                <Link
                  className="news-article-list-card"
                  href={article.publicPath}
                  key={article.id}
                >
                  <div className="news-chip-row">
                    <span className="news-chip news-chip-primary">
                      Catalyst Watch
                    </span>
                    <span className="news-chip">
                      {getPublicCatalystArticleDate(article)}
                    </span>
                  </div>
                  <h3>{getPublicCatalystArticleTitle(article)}</h3>
                  {getPublicCatalystArticleExcerpt(article) ? (
                    <p>{getPublicCatalystArticleExcerpt(article)}</p>
                  ) : null}
                </Link>
              ))}
            </div>
          ) : (
            <div className="news-empty-card">
              <h2>No catalyst articles yet</h2>
              <p>
                Run the weekly scraper with AI rewriting enabled to publish the
                first article.
              </p>
            </div>
          )}
        </section>
      </main>
    </SiteShell>
  );
}
