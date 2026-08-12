import Box from "@mui/material/Box";
import Chip from "@mui/material/Chip";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";

import { formatCoachAiMoneyForDisplay } from "@/src/modules/coach/presentation/coach-ai-money-formatters";

export type AiReviewDocumentView = Readonly<{
  reviewTypeLabel: "Weekly AI Review" | "Two-week AI Review" | "Monthly AI Review";
  periodLabel: string;
  reviewSummary: string;
  whatImproved: string;
  whatHeldYouBack: string;
  focusFollowThrough: string;
  nextPeriodFocuses: readonly string[];
  incompleteRecord: string | null;
}>;

function ReviewSection({
  children,
  title,
  tone = "neutral",
}: Readonly<{
  children: React.ReactNode;
  title: string;
  tone?: "neutral" | "positive" | "caution";
}>) {
  const colors = tone === "positive"
    ? { background: "rgba(35, 109, 74, 0.05)", border: "rgba(35, 109, 74, 0.22)" }
    : tone === "caution"
      ? { background: "rgba(180, 109, 17, 0.05)", border: "rgba(180, 109, 17, 0.22)" }
      : { background: "background.paper", border: "divider" };
  return (
    <Box
      component="section"
      sx={{
        bgcolor: colors.background,
        border: 1,
        borderColor: colors.border,
        borderRadius: 2,
        p: { xs: 2, sm: 2.5 },
      }}
    >
      <Typography component="h2" sx={{ fontWeight: 850, mb: 1 }} variant="h3">
        {title}
      </Typography>
      {children}
    </Box>
  );
}

export function AiReviewDocument({ view }: Readonly<{ view: AiReviewDocumentView }>) {
  return (
    <Stack component="article" spacing={2.25}>
      <Box
        component="header"
        sx={{
          background: "linear-gradient(135deg, rgba(1, 30, 86, 0.08), rgba(1, 30, 86, 0.025))",
          border: 1,
          borderColor: "rgba(1, 30, 86, 0.16)",
          borderRadius: 2.5,
          p: { xs: 2.25, sm: 3 },
        }}
      >
        <Stack spacing={1.25}>
          <Chip
            color="primary"
            label={view.reviewTypeLabel}
            size="small"
            sx={{ alignSelf: "flex-start", fontWeight: 800 }}
          />
          <Typography component="h1" variant="h1">{view.periodLabel}</Typography>
          <Typography color="text.secondary" variant="body2">
            Your saved review is based on the verified trading evidence available when it was generated.
          </Typography>
        </Stack>
      </Box>

      <Box
        component="section"
        sx={{
          bgcolor: "background.paper",
          border: 1,
          borderColor: "divider",
          borderRadius: 2,
          p: { xs: 2.25, sm: 3 },
        }}
      >
        <Typography color="text.secondary" sx={{ fontWeight: 800, letterSpacing: "0.04em", mb: 1 }} variant="overline">
          Review summary
        </Typography>
        <Typography sx={{ fontSize: { sm: "1.0625rem" }, lineHeight: 1.75, whiteSpace: "pre-wrap" }} variant="body1">
          {formatCoachAiMoneyForDisplay(view.reviewSummary)}
        </Typography>
      </Box>

      <Box
        sx={{
          display: "grid",
          gap: 2.25,
          gridTemplateColumns: { xs: "1fr", lg: "repeat(2, minmax(0, 1fr))" },
        }}
      >
        <ReviewSection title="What improved" tone="positive">
          <Typography sx={{ lineHeight: 1.7, whiteSpace: "pre-wrap" }} variant="body1">
            {formatCoachAiMoneyForDisplay(view.whatImproved)}
          </Typography>
        </ReviewSection>
        <ReviewSection title="What held you back" tone="caution">
          <Typography sx={{ lineHeight: 1.7, whiteSpace: "pre-wrap" }} variant="body1">
            {formatCoachAiMoneyForDisplay(view.whatHeldYouBack)}
          </Typography>
        </ReviewSection>
      </Box>

      <ReviewSection title="Focus follow-through">
        <Typography sx={{ lineHeight: 1.7, whiteSpace: "pre-wrap" }} variant="body1">
          {formatCoachAiMoneyForDisplay(view.focusFollowThrough)}
        </Typography>
      </ReviewSection>

      <ReviewSection title="Focus until your next review">
        {view.nextPeriodFocuses.length > 0 ? (
          <Stack component="ol" spacing={1.25} sx={{ listStyle: "none", m: 0, p: 0 }}>
            {view.nextPeriodFocuses.map((focus, index) => (
              <Box
                component="li"
                key={`${focus}-${index}`}
                sx={{ display: "grid", gap: 1.25, gridTemplateColumns: "2rem minmax(0, 1fr)" }}
              >
                <Box
                  aria-hidden="true"
                  sx={{
                    alignItems: "center",
                    bgcolor: "primary.main",
                    borderRadius: "50%",
                    color: "primary.contrastText",
                    display: "flex",
                    fontSize: "0.8125rem",
                    fontWeight: 850,
                    height: "2rem",
                    justifyContent: "center",
                    width: "2rem",
                  }}
                >
                  {index + 1}
                </Box>
                <Typography sx={{ lineHeight: 1.65, pt: 0.35 }} variant="body1">
                  {formatCoachAiMoneyForDisplay(focus)}
                </Typography>
              </Box>
            ))}
          </Stack>
        ) : (
          <Typography color="text.secondary" variant="body2">
            No focuses were saved with this review.
          </Typography>
        )}
      </ReviewSection>

      {view.incompleteRecord !== null ? (
        <Box
          component="aside"
          sx={{ bgcolor: "action.hover", borderRadius: 2, px: 2.25, py: 1.75 }}
        >
          <Typography sx={{ fontWeight: 800, mb: 0.5 }} variant="body2">Coverage note</Typography>
          <Typography color="text.secondary" sx={{ lineHeight: 1.6, whiteSpace: "pre-wrap" }} variant="body2">
            {formatCoachAiMoneyForDisplay(view.incompleteRecord)}
          </Typography>
        </Box>
      ) : null}
    </Stack>
  );
}
