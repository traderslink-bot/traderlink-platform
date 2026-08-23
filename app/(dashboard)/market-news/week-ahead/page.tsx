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
    ? new Intl.DateTimeFormat("en-US", {
        dateStyle: "medium",
        timeStyle: "short",
        timeZone: "America/New_York",
      }).format(date)
    : "";
}

export default async function WeekAheadPage() {
  await requireTraderLinkPlatformPageScope();
  const issue = withReadonlyPlatformDatabase({}, (database) =>
    new WeekAheadRepository(database).current(),
  );

  return (
    <DashboardPage>
      <Typography component="h1" variant="h1">
        The Week Ahead
      </Typography>
      {!issue ? (
        <DashboardPanel title="This week's catalyst calendar">
          <Typography color="text.secondary">
            The next weekly market calendar will appear here when it is ready.
          </Typography>
        </DashboardPanel>
      ) : (
        <Stack spacing={2}>
          <DashboardPanel title={issue.structuredContent.dateRange}>
            <Stack spacing={1.5}>
              <Typography sx={{ fontWeight: 800 }} variant="h5">
                {issue.title}
              </Typography>
              <Typography color="text.secondary">{issue.excerpt}</Typography>
              <Typography color="text.secondary" variant="caption">
                Updated {formatDate(issue.updatedAtUtc)} ET
              </Typography>
            </Stack>
          </DashboardPanel>

          <DashboardPanel title="This week at a glance">
            <Typography sx={{ whiteSpace: "pre-line" }}>
              {issue.articleText}
            </Typography>
          </DashboardPanel>

          <DashboardPanel title="Catalysts by date">
            <Stack divider={<Divider flexItem />} spacing={0}>
              {issue.structuredContent.companyCatalysts.map((group) => (
                <Box key={group.dateLabel} sx={{ py: 1.5 }}>
                  <Typography sx={{ fontWeight: 800, mb: 1 }} variant="subtitle1">
                    {group.dateLabel}
                  </Typography>
                  <Stack spacing={1.25}>
                    {group.items.map((item) => (
                      <Stack
                        direction="row"
                        key={`${group.dateLabel}-${item.ticker}-${item.text}`}
                        spacing={1}
                        sx={{ alignItems: "flex-start" }}
                      >
                        <Chip
                          color="primary"
                          label={item.ticker}
                          size="small"
                          sx={{ fontWeight: 800, mt: 0.1 }}
                        />
                        <Typography variant="body2">{item.text}</Typography>
                      </Stack>
                    ))}
                  </Stack>
                </Box>
              ))}
            </Stack>
          </DashboardPanel>

          {issue.structuredContent.conferenceEvents.length > 0 ? (
            <DashboardPanel title="Conferences and events">
              <Stack divider={<Divider flexItem />} spacing={0}>
                {issue.structuredContent.conferenceEvents.map((event) => (
                  <Box key={`${event.dateLabel}-${event.title}`} sx={{ py: 1.5 }}>
                    <Typography sx={{ fontWeight: 800 }} variant="subtitle1">
                      {event.title}
                    </Typography>
                    <Typography color="text.secondary" variant="body2">
                      {event.dateLabel}
                    </Typography>
                    <Typography sx={{ mt: 0.75 }} variant="body2">
                      {event.summary}
                    </Typography>
                    {event.tickers.length > 0 ? (
                      <Stack
                        direction="row"
                        spacing={0.75}
                        sx={{ flexWrap: "wrap", mt: 1 }}
                        useFlexGap
                      >
                        {event.tickers.map((ticker) => (
                          <Chip key={ticker} label={ticker} size="small" />
                        ))}
                      </Stack>
                    ) : null}
                  </Box>
                ))}
              </Stack>
            </DashboardPanel>
          ) : null}

          {issue.riskNotes.length > 0 ? (
            <DashboardPanel title="Keep in mind">
              <Stack component="ul" spacing={0.75} sx={{ m: 0, pl: 2.5 }}>
                {issue.riskNotes.map((note) => (
                  <Typography component="li" key={note} variant="body2">
                    {note}
                  </Typography>
                ))}
              </Stack>
            </DashboardPanel>
          ) : null}
        </Stack>
      )}
    </DashboardPage>
  );
}
