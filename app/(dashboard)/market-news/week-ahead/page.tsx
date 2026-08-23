import type { Metadata } from "next";

import { DashboardPage, DashboardPanel } from "../../../dashboard-template";
import { WeekAheadRepository } from "@/src/modules/news/server/week-ahead-repository";
import { requireTraderLinkPlatformPageScope } from "@/src/modules/platform/server/authentication/require-platform-request-scope";
import { withReadonlyPlatformDatabase } from "@/src/modules/platform/server/database/open-readonly-platform-database";

export const metadata: Metadata = {
  description: "This week's small-cap market catalysts and events.",
  title: "The Week Ahead | TradersLink Platform",
};

export const dynamic = "force-dynamic";
export const revalidate = 0;

function TickerList({ tickers }: { tickers: readonly string[] }) {
  return (
    <div className="catalyst-ticker-list" aria-label="Symbols">
      {tickers.map((ticker) => (
        <strong className="catalyst-ticker" key={ticker}>
          {ticker}
        </strong>
      ))}
    </div>
  );
}

export default async function WeekAheadPage() {
  await requireTraderLinkPlatformPageScope();
  const issue = withReadonlyPlatformDatabase({}, (database) =>
    new WeekAheadRepository(database).current(),
  );

  return (
    <DashboardPage>
      {!issue ? (
        <DashboardPanel title="This week's catalyst calendar">
          <p className="news-muted">
            The next weekly market calendar will appear here when it is ready.
          </p>
        </DashboardPanel>
      ) : (
        <div className="news-article-stack">
          <header className="news-surface-card news-article-header-card">
            <div className="news-article-header-copy">
              <div className="news-chip-row">
                <span className="news-chip">{issue.structuredContent.dateRange}</span>
              </div>
              <h1 className="news-article-title">{issue.title}</h1>
            </div>
          </header>

          <div className="news-main-stack">
            <section className="news-surface-card catalyst-week-ahead-card">
              <div className="news-card-heading">
                <h2 className="news-card-title">The Week Ahead</h2>
              </div>
              <div className="catalyst-article-body">
                {issue.structuredContent.conferenceEvents.length > 0 ? (
                  <section className="catalyst-week-section catalyst-week-section-divided">
                    <div className="catalyst-section-divider" aria-hidden="true" />
                    <h2>Upcoming Conferences and Investor Events</h2>
                    <div className="catalyst-event-list catalyst-list-no-first-border">
                      {issue.structuredContent.conferenceEvents.map((event) => (
                        <article className="catalyst-event-item" key={`${event.dateLabel}-${event.title}`}>
                          <div className="catalyst-event-date">{event.dateLabel}</div>
                          <div>
                            <h3>{event.title}</h3>
                            <p>{event.summary}</p>
                            <TickerList tickers={event.tickers} />
                          </div>
                        </article>
                      ))}
                    </div>
                  </section>
                ) : null}

                {issue.structuredContent.companyCatalysts.length > 0 ? (
                  <section className="catalyst-week-section catalyst-week-section-divided">
                    <div className="catalyst-section-divider" aria-hidden="true" />
                    <h2>Company-Specific Catalysts</h2>
                    <div className="catalyst-date-list catalyst-list-no-first-border">
                      {issue.structuredContent.companyCatalysts.map((group) => (
                        <section className="catalyst-date-group" key={group.dateLabel}>
                          <h3>{group.dateLabel}</h3>
                          <ul>
                            {group.items.map((item) => (
                              <li key={`${group.dateLabel}-${item.ticker}-${item.text}`}>
                                <strong>{item.ticker}</strong> - {item.text}
                              </li>
                            ))}
                          </ul>
                        </section>
                      ))}
                    </div>
                  </section>
                ) : null}
              </div>
            </section>

            {issue.riskNotes.length > 0 ? (
              <section className="news-surface-card">
                <div className="news-card-heading">
                  <h2 className="news-card-title">Risk Notes</h2>
                </div>
                <ul className="news-bullet-list">
                  {issue.riskNotes.map((note) => <li key={note}>{note}</li>)}
                </ul>
              </section>
            ) : null}
          </div>
        </div>
      )}
    </DashboardPage>
  );
}
