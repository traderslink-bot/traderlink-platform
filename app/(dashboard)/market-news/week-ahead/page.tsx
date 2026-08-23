import type { Metadata } from "next";
import Box from "@mui/material/Box";
import Chip from "@mui/material/Chip";
import Divider from "@mui/material/Divider";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";

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

function formatDate(value: string): string {
  const date = new Date(value);
  return Number.isFinite(date.getTime())
    ? new Intl.DateTimeFormat("en-US", { dateStyle: "medium", timeStyle: "short", timeZone: "America/New_York" }).format(date)
    : "";
}

function TickerPills({ tickers }: { tickers: readonly string[] }) {
  if (tickers.length === 0) return null;

  return (
    <Stack direction="row" spacing={0.75} sx={{ flexWrap: "wrap", mt: 1.25 }} useFlexGap>
      {tickers.map((ticker) => (
        <Chip
          key={ticker}
          label={ticker}
          size="small"
          sx={{
            bgcolor: "rgba(1, 30, 86, 0.07)",
            color: "primary.main",
            fontWeight: 800,
          }}
        />
      ))}
    </Stack>
  );
}

export default async function WeekAheadPage() {
  await requireTraderLinkPlatformPageScope();
  const issue = withReadonlyPlatformDatabase({}, (database) => new WeekAheadRepository(database).current());

  return (
    <DashboardPage>
      <Typography component="h1" variant="h1">The Week Ahead</Typography>
      {!issue ? (
        <DashboardPanel title="This week's catalyst calendar">
          <Typography color="text.secondary">The next weekly market calendar will appear here when it is ready.</Typography>
        </DashboardPanel>
      ) : (
        <Stack spacing={2.5} sx={{ maxWidth: 1180 }}>
          <DashboardPanel hideHeader>
            <Stack spacing={1.25}>
              <Chip
                label={issue.structuredContent.dateRange}
                size="small"
                sx={{ alignSelf: "flex-start", fontWeight: 800 }}
              />
              <Typography component="h2" sx={{ fontWeight: 820, lineHeight: 1.15 }} variant="h2">
                {issue.title}
              </Typography>
              <Typography color="text.secondary" sx={{ maxWidth: 900 }}>
                {issue.excerpt}
              </Typography>
              <Typography color="text.secondary" variant="caption">
                Updated {formatDate(issue.updatedAtUtc)} ET
              </Typography>
            </Stack>
          </DashboardPanel>

          <DashboardPanel hideHeader>
            <Stack spacing={2.25}>
              {issue.structuredContent.conferenceEvents.length > 0 ? (
                <Box>
                  <Typography component="h2" sx={{ fontWeight: 800 }} variant="h2">
                    Upcoming conferences and investor events
                  </Typography>
                  <Divider sx={{ mt: 1.25 }} />
                  <Stack spacing={0}>
                    {issue.structuredContent.conferenceEvents.map((event) => (
                      <Stack
                        direction={{ xs: "column", sm: "row" }}
                        key={`${event.dateLabel}-${event.title}`}
                        spacing={{ xs: 0.75, sm: 2.5 }}
                        sx={{ borderBottom: 1, borderColor: "divider", py: 2 }}
                      >
                        <Typography
                          color="primary.main"
                          sx={{ flex: "0 0 120px", fontSize: "0.9rem", fontWeight: 800 }}
                        >
                          {event.dateLabel}
                        </Typography>
                        <Box sx={{ minWidth: 0 }}>
                          <Typography component="h3" sx={{ fontWeight: 800 }} variant="subtitle1">
                            {event.title}
                          </Typography>
                          <Typography color="text.secondary" sx={{ mt: 0.5 }} variant="body2">
                            {event.summary}
                          </Typography>
                          <TickerPills tickers={event.tickers} />
                        </Box>
                      </Stack>
                    ))}
                  </Stack>
                </Box>
              ) : null}

              {issue.structuredContent.companyCatalysts.length > 0 ? (
                <Box>
                  {issue.structuredContent.conferenceEvents.length > 0 ? <Divider sx={{ mb: 2.25 }} /> : null}
                  <Typography component="h2" sx={{ fontWeight: 800 }} variant="h2">
                    Company-specific catalysts
                  </Typography>
                  <Divider sx={{ mt: 1.25 }} />
                  <Stack spacing={0}>
                    {issue.structuredContent.companyCatalysts.map((group) => (
                      <Box
                        key={group.dateLabel}
                        sx={{ borderBottom: 1, borderColor: "divider", py: 2 }}
                      >
                        <Typography color="primary.main" component="h3" sx={{ fontWeight: 800 }} variant="subtitle1">
                          {group.dateLabel}
                        </Typography>
                        <Stack component="ul" spacing={0.9} sx={{ m: 0, mt: 1.25, pl: 2.5 }}>
                          {group.items.map((item) => (
                            <Typography component="li" key={`${group.dateLabel}-${item.ticker}-${item.text}`} variant="body2">
                              <Box component="span" sx={{ color: "text.primary", fontWeight: 800 }}>
                                {item.ticker}
                              </Box>{" "}
                              — {item.text}
                            </Typography>
                          ))}
                        </Stack>
                      </Box>
                    ))}
                  </Stack>
                </Box>
              ) : null}
            </Stack>
          </DashboardPanel>

          {issue.riskNotes.length > 0 ? (
            <DashboardPanel title="Risk notes">
              <Stack component="ul" spacing={0.9} sx={{ m: 0, pl: 2.5 }}>
                {issue.riskNotes.map((note) => <Typography component="li" key={note} variant="body2">{note}</Typography>)}
              </Stack>
            </DashboardPanel>
          ) : null}
        </Stack>
      )}
    </DashboardPage>
  );
}
