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
          bgcolor: "#173b78",
          minHeight: "100%",
          p: { xs: 1.25, sm: 2.5 },
        }}
      >
        <Box
          sx={{
            bgcolor: (theme) => theme.palette.mode === "dark" ? theme.palette.background.paper : "#fff",
            border: "1px solid rgba(1, 30, 86, 0.1)",
            borderRadius: { xs: 2.25, sm: 3 },
            boxShadow: "0 1rem 3rem rgba(0, 0, 0, 0.175)",
            margin: "0 auto",
            maxWidth: 810,
            p: { xs: 1, sm: 2.5 },
          }}
        >
          <Box
            sx={{
              background: "radial-gradient(circle at 100% 0, rgba(80, 157, 219, 0.3), transparent 38%), linear-gradient(155deg, #011e56 0%, #00133f 100%)",
              border: "1px solid #00133f",
              borderRadius: { xs: 1.75, sm: 2.25 },
              color: "#fff",
              overflow: "hidden",
              p: { xs: 2.25, sm: 4 },
              position: "relative",
            }}
          >
            <Stack spacing={{ xs: 3, sm: 4 }}>
              <Stack spacing={2} sx={{ maxWidth: 680 }}>
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

              <Stack spacing={1.25}>
                {BENEFITS.map((benefit) => (
                  <Box
                    key={benefit.title}
                    sx={{
                      alignItems: "flex-start",
                      bgcolor: (theme) => theme.palette.mode === "dark" ? theme.palette.action.selected : "#fff",
                      border: "1px solid rgba(1, 30, 86, 0.12)",
                      borderRadius: 1.5,
                      boxShadow: "0 3px 7px rgba(0, 11, 39, 0.2)",
                      color: "text.primary",
                      display: "flex",
                      gap: 1.5,
                      p: { xs: 1.5, sm: 2 },
                    }}
                  >
                    <Box
                      sx={{
                        alignItems: "center",
                        bgcolor: "#011e56",
                        borderRadius: "50%",
                        color: "#fff",
                        display: "inline-flex",
                        flex: "0 0 auto",
                        height: "2rem",
                        justifyContent: "center",
                        width: "2rem",
                      }}
                    >
                      {benefit.icon}
                    </Box>
                    <Box>
                      <Typography sx={{ fontWeight: 800 }}>{benefit.title}</Typography>
                      <Typography color="text.secondary" sx={{ fontSize: "0.9rem", lineHeight: 1.5, mt: 0.35 }}>
                        {benefit.description}
                      </Typography>
                    </Box>
                  </Box>
                ))}
              </Stack>

              <Box
                sx={{
                  bgcolor: (theme) => theme.palette.mode === "dark" ? theme.palette.background.paper : "#fff",
                  borderRadius: 1.5,
                  color: "text.primary",
                  p: { xs: 2, sm: 2.5 },
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
        </Box>
      </Box>
    </DashboardPage>
  );
}
