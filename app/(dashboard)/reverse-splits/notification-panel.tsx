import Alert from "@mui/material/Alert";
import Box from "@mui/material/Box";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import { requireTraderLinkPlatformServerComponentPageIdentity } from "@/src/modules/platform/server/authentication/require-platform-request-scope";
import { withReadonlyPlatformDatabase } from "@/src/modules/platform/server/database/open-readonly-platform-database";
import { CoachUsEquitiesCalendarRepository } from "@/src/modules/coach/server/market-calendar/coach-us-equities-calendar-repository";
import { hasReverseSplitReviewAccess } from "@/src/modules/news/server/reverse-splits/access";
import { readReverseSplitNotificationSettings } from "@/src/modules/news/server/reverse-splits/notification-settings";
import { ReverseSplitNotificationStore } from "@/src/modules/news/server/reverse-splits/notification-store";
import { ReverseSplitRepository } from "@/src/modules/news/server/reverse-splits/repository";
import { ReverseSplitDigestPlanner } from "@/src/modules/news/server/reverse-splits/digest";
import { ReverseSplitNotificationControls } from "./notification-controls";

export async function ReverseSplitNotificationPanel({ preview = false }: { preview?: boolean }) {
  const identity = await requireTraderLinkPlatformServerComponentPageIdentity();
  if (!hasReverseSplitReviewAccess(identity)) return null;
  const data = withReadonlyPlatformDatabase({}, (database) => {
    const settings = readReverseSplitNotificationSettings(database, identity.scope.userId);
    let parts: readonly string[] = [];
    if (preview && settings.available) {
      try {
        parts = new ReverseSplitDigestPlanner(new ReverseSplitRepository(database), new ReverseSplitNotificationStore(database),
          new CoachUsEquitiesCalendarRepository(database).calendar(), "https://app.traderslink.pro/reverse-splits").preview(new Date()).parts ?? [];
      } catch { parts = []; }
    }
    return { settings, parts };
  });
  return <Stack spacing={2}>
    <ReverseSplitNotificationControls key={JSON.stringify(data.settings)} initial={data.settings} />
    {preview ? <>
      <Typography component="h3" variant="subtitle1">Discord post preview</Typography>
      <Typography variant="body2" color="text.secondary">Private #reverse-splits · Daily at 7 PM Eastern. Preview only—opening this page sends nothing. After posting, the latest prepared post is shown.</Typography>
      {data.parts.length ? data.parts.map((part, index) => <Box component="pre" key={index}
        sx={{ m: 0, p: 2, bgcolor: "action.hover", color: "text.primary", borderRadius: 1, whiteSpace: "pre-wrap", overflowWrap: "anywhere", font: "inherit" }}>{part}</Box>)
        : <Alert severity="info">A post preview will appear when current source data is available.</Alert>}
    </> : null}
  </Stack>;
}
