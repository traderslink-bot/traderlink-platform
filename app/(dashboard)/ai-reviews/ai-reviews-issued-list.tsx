import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";

import { DashboardPanel } from "@/app/dashboard-template";
import { formatCoachAiMoneyForDisplay } from "@/src/modules/coach/presentation/coach-ai-money-formatters";

export type AiReviewListItem = Readonly<{
  href: string;
  summary: string;
  title: string;
}>;

function ReviewCard({ href, summary, title }: AiReviewListItem) {
  return (
    <Box component="article" sx={{ border: 1, borderColor: "divider", borderRadius: 1.5, p: 2 }}>
      <Stack direction={{ xs: "column", sm: "row" }} spacing={1.5} sx={{ alignItems: { sm: "flex-start" }, justifyContent: "space-between" }}>
        <Box sx={{ minWidth: 0 }}>
          <Typography sx={{ fontWeight: 800 }} variant="h3">{title}</Typography>
          <Typography color="text.secondary" sx={{ mt: 0.75, whiteSpace: "pre-wrap" }} variant="body2">
            {formatCoachAiMoneyForDisplay(summary)}
          </Typography>
        </Box>
        <Button href={href} size="small" variant="outlined">Open review</Button>
      </Stack>
    </Box>
  );
}

function ReviewGroup({ emptyCopy, emptyTitle, items, title }: {
  emptyCopy: string;
  emptyTitle: string;
  items: readonly AiReviewListItem[];
  title: string;
}) {
  return (
    <DashboardPanel title={title}>
      {items.length === 0 ? (
        <Stack spacing={0.75}>
          <Typography sx={{ fontWeight: 800 }}>{emptyTitle}</Typography>
          <Typography color="text.secondary" variant="body2">{emptyCopy}</Typography>
        </Stack>
      ) : (
        <Stack spacing={1.25}>{items.map((item) => <ReviewCard {...item} key={item.href} />)}</Stack>
      )}
    </DashboardPanel>
  );
}

export function AiReviewsIssuedList({ monthly, periodic }: {
  monthly: readonly AiReviewListItem[];
  periodic: readonly AiReviewListItem[];
}) {
  return (
    <>
      <ReviewGroup emptyCopy="Saved weekly and two-week reviews will appear here for this Trade Tracker account." emptyTitle="No weekly reviews yet" items={periodic} title="Weekly and two-week reviews" />
      <ReviewGroup emptyCopy="Saved calendar-month reviews will appear here for this Trade Tracker account." emptyTitle="No monthly reviews yet" items={monthly} title="Monthly reviews" />
    </>
  );
}
