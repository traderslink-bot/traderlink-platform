import ArrowForwardRoundedIcon from "@mui/icons-material/ArrowForwardRounded";
import CheckCircleOutlineRoundedIcon from "@mui/icons-material/CheckCircleOutlineRounded";
import Box from "@mui/material/Box";
import Breadcrumbs from "@mui/material/Breadcrumbs";
import Button from "@mui/material/Button";
import Card from "@mui/material/Card";
import CardActionArea from "@mui/material/CardActionArea";
import CardContent from "@mui/material/CardContent";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import Link from "next/link";

import { DashboardPage, DashboardPanel } from "../../dashboard-template";
import type { HelpGuide } from "@/src/modules/help/help-guide-types";
import type { HelpArticleAction } from "./help-article";

export function HelpCollectionOverview({
  actions,
  description,
  guides,
  highlights,
  href,
  steps,
  title,
}: {
  actions: readonly HelpArticleAction[];
  description?: string;
  guides: readonly HelpGuide[];
  highlights: readonly string[];
  href: string;
  steps: readonly Readonly<{ description: string; title: string }>[];
  title: string;
}) {
  return (
    <DashboardPage>
      <Box>
        <Breadcrumbs aria-label="Help breadcrumb" sx={{ mb: 1.25 }}>
          <Link href="/help">Help Center</Link>
          <Typography color="text.primary">{title}</Typography>
        </Breadcrumbs>
        <Typography component="h1" variant="h1">{title}</Typography>
        {description ? (
          <Typography color="text.secondary" sx={{ maxWidth: 800, mt: 1 }} variant="body1">
            {description}
          </Typography>
        ) : null}
        <Stack direction={{ xs: "column", sm: "row" }} spacing={1.25} sx={{ mt: 2 }}>
          {actions.map((action) => (
            <Link href={action.href} key={action.href} style={{ textDecoration: "none" }}>
              <Button
                component="span"
                endIcon={action.variant === "contained" ? <ArrowForwardRoundedIcon /> : undefined}
                fullWidth
                variant={action.variant ?? "outlined"}
              >
                {action.label}
              </Button>
            </Link>
          ))}
        </Stack>
      </Box>

      <DashboardPanel title="How it works">
        <Box sx={{ display: "grid", gap: 1.5, gridTemplateColumns: { xs: "1fr", lg: `repeat(${Math.min(steps.length, 4)}, minmax(0, 1fr))` } }}>
          {steps.map((step, index) => (
            <Card key={step.title} variant="outlined">
              <CardContent sx={{ p: 1.75, "&:last-child": { pb: 1.75 } }}>
                <Box sx={{ alignItems: "center", bgcolor: "primary.main", borderRadius: "50%", color: "common.white", display: "flex", fontSize: 13, fontWeight: 900, height: 28, justifyContent: "center", width: 28 }}>
                  {index + 1}
                </Box>
                <Typography sx={{ fontWeight: 850, mt: 1.25 }} variant="body1">{step.title}</Typography>
                <Typography color="text.secondary" sx={{ mt: 0.6 }} variant="body2">{step.description}</Typography>
              </CardContent>
            </Card>
          ))}
        </Box>
      </DashboardPanel>

      <DashboardPanel title={`${title} guides`}>
        <Box sx={{ display: "grid", gap: 1.5, gridTemplateColumns: { xs: "1fr", lg: "1fr 1fr" } }}>
          {guides.map((guide, index) => (
            <Link href={`${href}/${guide.slug}`} key={guide.slug} style={{ color: "inherit", textDecoration: "none" }}>
              <Card sx={{ height: "100%" }} variant="outlined">
                <CardActionArea component="div" sx={{ height: "100%" }}>
                  <CardContent sx={{ p: 2, "&:last-child": { pb: 2 } }}>
                    <Stack direction="row" spacing={1.25} sx={{ alignItems: "flex-start" }}>
                      <Box sx={{ alignItems: "center", bgcolor: "rgba(1, 30, 86, 0.08)", borderRadius: "50%", color: "primary.main", display: "flex", flexShrink: 0, fontSize: 13, fontWeight: 900, height: 30, justifyContent: "center", width: 30 }}>
                        {index + 1}
                      </Box>
                      <Box sx={{ minWidth: 0 }}>
                        <Typography sx={{ fontWeight: 850 }} variant="body1">{guide.title}</Typography>
                        <Typography color="text.secondary" sx={{ mt: 0.45 }} variant="body2">{guide.description}</Typography>
                        <Stack direction="row" spacing={0.5} sx={{ alignItems: "center", color: "primary.main", mt: 1.1 }}>
                          <Typography sx={{ fontWeight: 800 }} variant="caption">Read guide</Typography>
                          <ArrowForwardRoundedIcon fontSize="small" />
                        </Stack>
                      </Box>
                    </Stack>
                  </CardContent>
                </CardActionArea>
              </Card>
            </Link>
          ))}
        </Box>
      </DashboardPanel>

      <DashboardPanel title="Good to know">
        <Stack spacing={1.35}>
          {highlights.map((highlight) => (
            <Stack direction="row" key={highlight} spacing={1} sx={{ alignItems: "flex-start" }}>
              <CheckCircleOutlineRoundedIcon color="primary" fontSize="small" sx={{ mt: 0.2 }} />
              <Typography color="text.secondary" variant="body2">{highlight}</Typography>
            </Stack>
          ))}
        </Stack>
      </DashboardPanel>
    </DashboardPage>
  );
}
