import Box from "@mui/material/Box";
import Chip from "@mui/material/Chip";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import { alpha } from "@mui/material/styles";

import { formatCoachAiMoneyForDisplay } from
  "@/src/modules/coach/presentation/coach-ai-money-formatters";
import type {
  CoachAiReviewAuthoredOutput,
  CoachAiReviewAuthoredPacket,
} from "@/src/modules/coach/server/coach-ai-review-authored-persistence-repository";

export type AiReviewAuthoredDocumentView = Readonly<{
  metricLabels?: readonly string[];
  packet?: CoachAiReviewAuthoredPacket;
  reviewTypeLabel: "Weekly AI Review" | "Two-week AI Review" | "Monthly AI Review";
  periodLabel: string;
  output: CoachAiReviewAuthoredOutput;
}>;

function ReviewSection({ children, title }: Readonly<{
  children: React.ReactNode;
  title: string;
}>) {
  return (
    <Box component="section" sx={{ border: 1, borderColor: "divider", borderRadius: 2, p: { xs: 2, sm: 2.5 } }}>
      <Typography component="h2" sx={{ fontSize: "1.125rem", fontWeight: 850, mb: 1 }}>
        {title}
      </Typography>
      {children}
    </Box>
  );
}

function ReviewText({ children }: Readonly<{ children: string }>) {
  return (
    <Typography sx={{ lineHeight: 1.72, whiteSpace: "pre-wrap" }} variant="body1">
      {formatCoachAiMoneyForDisplay(children)}
    </Typography>
  );
}

export function AiReviewAuthoredDocument({ view }: Readonly<{ view: AiReviewAuthoredDocumentView }>) {
  const monthly = view.output.contractVersion ===
    "traderlink_coach_monthly_ai_review_authored_output_v1";
  const metricLabels = view.metricLabels ?? (view.packet?.packetVersion ===
    "traderlink_coach_monthly_ai_review_evidence_packet_v1"
    ? view.packet.monthSnapshot.metrics.map((metric) => metric.displayValue)
    : view.packet?.weekSnapshot.metrics.map((metric) => metric.displayValue) ?? []);
  const recap = monthly ? view.output.monthlyRecap : view.output.weeklyRecap;
  const narrative = monthly ? view.output.monthNarrative : view.output.weekNarrative;
  const insights = view.output.additionalInsights;
  return (
    <Stack component="article" spacing={2.25}>
      <Box
        component="header"
        sx={{
          background: (theme) => theme.palette.mode === "dark"
            ? `linear-gradient(135deg, ${alpha(theme.palette.primary.light, 0.18)}, ${alpha(theme.palette.background.paper, 0.42)})`
            : "linear-gradient(135deg, rgba(1, 30, 86, 0.08), rgba(1, 30, 86, 0.025))",
          border: 1,
          borderColor: (theme) => theme.palette.mode === "dark" ? alpha(theme.palette.primary.light, 0.48) : "rgba(1, 30, 86, 0.16)",
          borderRadius: 2.5,
          p: { xs: 2.25, sm: 3 },
        }}
      >
        <Stack spacing={1.25}>
          <Chip color="primary" label={view.reviewTypeLabel} size="small" sx={{ alignSelf: "flex-start", fontWeight: 800 }} />
          <Typography component="h1" sx={{ fontSize: { xs: "1.55rem", sm: "1.8rem" }, fontWeight: 850, lineHeight: 1.2 }}>
            {view.periodLabel}
          </Typography>
          <Stack direction="row" sx={{ flexWrap: "wrap", gap: 0.75 }}>
            {metricLabels.map((metric) => (
              <Chip key={metric} label={metric} size="small" variant="outlined" />
            ))}
          </Stack>
        </Stack>
      </Box>

      <ReviewSection title={monthly ? "Monthly recap" : "Weekly recap"}>
        <ReviewText>{recap}</ReviewText>
      </ReviewSection>

      <ReviewSection title={monthly ? "How the month unfolded" : "How the week unfolded"}>
        <ReviewText>{narrative}</ReviewText>
      </ReviewSection>

      {insights.length > 0 ? (
        <Stack spacing={2.25}>
          {insights.map((insight, index) => (
            <ReviewSection key={`${insight.title}-${index}`} title={insight.title}>
              <ReviewText>{insight.body}</ReviewText>
            </ReviewSection>
          ))}
        </Stack>
      ) : null}

      {view.output.incompleteRecord ? (
        <Box component="aside" sx={{ bgcolor: "action.hover", borderRadius: 2, px: 2.25, py: 1.75 }}>
          <Typography sx={{ fontWeight: 800, mb: 0.5 }} variant="body2">Coverage note</Typography>
          <Typography color="text.secondary" sx={{ lineHeight: 1.6, whiteSpace: "pre-wrap" }} variant="body2">
            {formatCoachAiMoneyForDisplay(view.output.incompleteRecord)}
          </Typography>
        </Box>
      ) : null}
    </Stack>
  );
}
