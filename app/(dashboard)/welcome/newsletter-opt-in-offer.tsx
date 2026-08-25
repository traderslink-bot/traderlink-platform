import ArrowForwardRoundedIcon from "@mui/icons-material/ArrowForwardRounded";
import CalendarMonthRoundedIcon from "@mui/icons-material/CalendarMonthRounded";
import ManageSearchRoundedIcon from "@mui/icons-material/ManageSearchRounded";
import NotificationsActiveRoundedIcon from "@mui/icons-material/NotificationsActiveRounded";
import Box from "@mui/material/Box";
import Chip from "@mui/material/Chip";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";

import { DashboardPage, DashboardPrimaryAction, DashboardSecondaryAction } from "../../dashboard-template";

type NewsletterOfferProps = Readonly<{
  canSubscribe: boolean;
  formAction?: (formData: FormData) => void | Promise<void>;
  preview?: boolean;
}>;

const BENEFITS = [
  {
    description: "Small-cap stocks with a potential catalyst in the week ahead.",
    icon: <NotificationsActiveRoundedIcon fontSize="small" />,
    title: "Catalysts to watch",
  },
  {
    description: "The event or reason each stock has earned a closer look.",
    icon: <CalendarMonthRoundedIcon fontSize="small" />,
    title: "What is ahead",
  },
  {
    description: "A focused starting point for your own market research.",
    icon: <ManageSearchRoundedIcon fontSize="small" />,
    title: "Your research list",
  },
] as const;

export function NewsletterOptInOffer({ canSubscribe, formAction, preview = false }: NewsletterOfferProps) {
  const submitType = preview ? "button" : "submit";
  const choices = canSubscribe ? (
    <Stack spacing={1.25}>
      <DashboardPrimaryAction
        endIcon={<ArrowForwardRoundedIcon />}
        name="weekAheadNewsletter"
        type={submitType}
        value="yes"
      >
        Send me The Week Ahead
      </DashboardPrimaryAction>
      <DashboardSecondaryAction
        name="weekAheadNewsletter"
        type={submitType}
        value="no"
      >
        No thanks, continue to TradersLink
      </DashboardSecondaryAction>
    </Stack>
  ) : (
    <DashboardPrimaryAction endIcon={<ArrowForwardRoundedIcon />} type={submitType}>
      Continue to TradersLink
    </DashboardPrimaryAction>
  );

  return (
    <DashboardPage>
      <Box
        sx={{
          bgcolor: "#011e56",
          borderRadius: { xs: 3, sm: 4 },
          boxShadow: "0 24px 56px rgba(1, 30, 86, 0.22)",
          color: "#fff",
          overflow: "hidden",
          position: "relative",
        }}
      >
        <Box
          sx={{
            bgcolor: "rgba(103, 198, 255, 0.2)",
            borderRadius: "50%",
            height: { xs: 260, sm: 350 },
            position: "absolute",
            right: { xs: -150, sm: -95 },
            top: { xs: -145, sm: -175 },
            width: { xs: 260, sm: 350 },
          }}
        />
        <Stack spacing={{ xs: 3, sm: 4 }} sx={{ p: { xs: 2.5, sm: 5 }, position: "relative" }}>
          <Stack spacing={2} sx={{ maxWidth: 760 }}>
            <Chip
              label="WEEKLY SMALL-CAP RESEARCH EMAIL"
              sx={{
                alignSelf: "flex-start",
                bgcolor: "rgba(164, 222, 255, 0.16)",
                border: "1px solid rgba(180, 230, 255, 0.48)",
                color: "#dff4ff",
                fontWeight: 800,
                letterSpacing: "0.06em",
              }}
              variant="outlined"
            />
            <Typography
              component="h1"
              sx={{ fontSize: { xs: "2.5rem", sm: "4rem" }, fontWeight: 850, letterSpacing: "-0.055em", lineHeight: 0.98 }}
            >
              The Week Ahead
            </Typography>
            <Typography sx={{ color: "#dff4ff", fontSize: { xs: "1.15rem", sm: "1.35rem" }, fontWeight: 650, lineHeight: 1.4, maxWidth: 620 }}>
              A list of small-cap stocks with potential catalysts that helps you prepare for the trading week.
            </Typography>
          </Stack>

          <Stack direction={{ xs: "column", md: "row" }} spacing={1.25}>
            {BENEFITS.map((benefit) => (
              <Box
                key={benefit.title}
                sx={{
                  bgcolor: "rgba(255, 255, 255, 0.1)",
                  border: "1px solid rgba(200, 235, 255, 0.2)",
                  borderRadius: 2,
                  flex: 1,
                  minWidth: 0,
                  p: 2,
                }}
              >
                <Box sx={{ color: "#8ed6ff", display: "inline-flex", mb: 1 }}>{benefit.icon}</Box>
                <Typography sx={{ fontWeight: 800 }}>{benefit.title}</Typography>
                <Typography sx={{ color: "rgba(255, 255, 255, 0.78)", fontSize: "0.9rem", lineHeight: 1.5, mt: 0.55 }}>
                  {benefit.description}
                </Typography>
              </Box>
            ))}
          </Stack>

          <Box
            sx={{
              bgcolor: "#fff",
              borderRadius: 2.5,
              color: "text.primary",
              maxWidth: 620,
              p: { xs: 2.25, sm: 3 },
            }}
          >
            <Stack spacing={1.25}>
              <Typography component="h2" sx={{ fontSize: "1.35rem", fontWeight: 850, letterSpacing: "-0.02em" }}>
                Get it in your inbox each week
              </Typography>
              <Typography color="text.secondary" variant="body2">
                {canSubscribe
                  ? "Emails will be sent to the email listed in your discord account."
                  : "Discord did not share a verified email address, so The Week Ahead cannot be sent to this account yet."}
              </Typography>
              {formAction ? <form action={formAction}>{choices}</form> : choices}
              {canSubscribe ? (
                <Typography color="text.secondary" variant="caption">
                  Research ideas, not trade recommendations. Occasional TradersLink product, education, and community updates may be included. Unsubscribe anytime.
                </Typography>
              ) : null}
            </Stack>
          </Box>
        </Stack>
      </Box>
    </DashboardPage>
  );
}
