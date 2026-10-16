import { DashboardPanel } from "@/app/dashboard-ui";
import { coachingReviewReadinessMessage, type coachingReviewReadiness } from "@/src/modules/communities/contracts/coaching-review-readiness";
import { CommunityTypography as Typography } from "./community-typography";

export function CoachingReviewReadinessNotice({ progress, journalAccess }: {
  progress: ReturnType<typeof coachingReviewReadiness>; journalAccess: boolean;
}) {
  const message = coachingReviewReadinessMessage(progress, journalAccess);
  return message ? <DashboardPanel title="Required review work"><Typography role="status">{message}</Typography></DashboardPanel> : null;
}
