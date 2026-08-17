import ArrowBackRoundedIcon from "@mui/icons-material/ArrowBackRounded";
import ArrowForwardRoundedIcon from "@mui/icons-material/ArrowForwardRounded";
import InfoOutlinedIcon from "@mui/icons-material/InfoOutlined";
import WarningAmberRoundedIcon from "@mui/icons-material/WarningAmberRounded";
import Box from "@mui/material/Box";
import Breadcrumbs from "@mui/material/Breadcrumbs";
import Button from "@mui/material/Button";
import Card from "@mui/material/Card";
import CardActionArea from "@mui/material/CardActionArea";
import CardContent from "@mui/material/CardContent";
import Chip from "@mui/material/Chip";
import Divider from "@mui/material/Divider";
import Paper from "@mui/material/Paper";
import Stack from "@mui/material/Stack";
import Table from "@mui/material/Table";
import TableBody from "@mui/material/TableBody";
import TableCell from "@mui/material/TableCell";
import TableHead from "@mui/material/TableHead";
import TableRow from "@mui/material/TableRow";
import Typography from "@mui/material/Typography";
import Link from "next/link";

import { DashboardPage } from "../../dashboard-template";
import { HorizontalScrollRegion } from "../horizontal-scroll-region";
import type { HelpArticleBlock, HelpGuide } from
  "@/src/modules/help/help-guide-types";

export type HelpArticleAction = Readonly<{
  href: string;
  label: string;
  variant?: "contained" | "outlined";
}>;

function ArticleBlock({ block }: { block: HelpArticleBlock }) {
  if (block.kind === "paragraph") {
    return <Typography color="text.secondary" variant="body1">{block.text}</Typography>;
  }
  if (block.kind === "bullets") {
    return (
      <Box component="ul" sx={{ color: "text.secondary", m: 0, pl: 2.75 }}>
        {block.items.map((item) => (
          <Typography component="li" key={item} sx={{ mb: 0.8, pl: 0.4 }} variant="body1">
            {item}
          </Typography>
        ))}
      </Box>
    );
  }
  if (block.kind === "steps") {
    return (
      <Stack spacing={1.25}>
        {block.items.map((item) => (
          <Box key={item.title} sx={{ borderLeft: 3, borderColor: "primary.main", pl: 1.5, py: 0.25 }}>
            <Typography sx={{ fontWeight: 850 }} variant="body1">{item.title}</Typography>
            <Typography color="text.secondary" sx={{ mt: 0.25 }} variant="body2">{item.text}</Typography>
          </Box>
        ))}
      </Stack>
    );
  }
  if (block.kind === "callout") {
    const warning = block.tone === "warning";
    return (
      <Box
        sx={{
          bgcolor: warning ? "rgba(237, 108, 2, 0.07)" : "rgba(25, 118, 210, 0.06)",
          border: 1,
          borderColor: warning ? "rgba(237, 108, 2, 0.28)" : "rgba(25, 118, 210, 0.22)",
          borderRadius: 1.5,
          p: 1.75,
        }}
      >
        <Stack direction="row" spacing={1} sx={{ alignItems: "flex-start" }}>
          {warning
            ? <WarningAmberRoundedIcon color="warning" fontSize="small" />
            : <InfoOutlinedIcon color="primary" fontSize="small" />}
          <Box>
            <Typography sx={{ fontWeight: 850 }} variant="body2">{block.title}</Typography>
            <Typography color="text.secondary" sx={{ mt: 0.35 }} variant="body2">{block.text}</Typography>
          </Box>
        </Stack>
      </Box>
    );
  }
  if (block.kind === "link") {
    return (
      <Box>
        <Typography color="text.secondary" variant="body1">{block.text}</Typography>
        <Link href={block.href} style={{ textDecoration: "none" }}>
          <Button component="span" endIcon={<ArrowForwardRoundedIcon />} sx={{ mt: 1 }} variant="outlined">
            {block.label}
          </Button>
        </Link>
      </Box>
    );
  }
  return (
    <Paper variant="outlined">
      <HorizontalScrollRegion label="Help comparison table" minTableWidth={Math.max(520, 150 + Math.max(0, block.columns.length - 1) * 260)} stickyFirstColumn>
        <Table size="small">
          <TableHead>
            <TableRow>
              {block.columns.map((column) => (
                <TableCell key={column} sx={{ bgcolor: "rgba(1, 30, 86, 0.045)", fontWeight: 850 }}>
                  {column}
                </TableCell>
              ))}
            </TableRow>
          </TableHead>
          <TableBody>
            {block.rows.map((row, rowIndex) => (
              <TableRow key={`${rowIndex}-${row[0]}`}>
                {row.map((cell, cellIndex) => (
                  <TableCell
                    key={`${cellIndex}-${cell}`}
                    sx={{
                      color: cellIndex === 0 ? "text.primary" : "text.secondary",
                      fontWeight: cellIndex === 0 ? 750 : 400,
                      minWidth: cellIndex === 0 ? 150 : 260,
                      verticalAlign: "top",
                    }}
                  >
                    {cell}
                  </TableCell>
                ))}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </HorizontalScrollRegion>
    </Paper>
  );
}
function GuideNavigation({
  collectionHref,
  guide,
  guides,
}: {
  collectionHref: string;
  guide: HelpGuide;
  guides: readonly HelpGuide[];
}) {
  const currentIndex = guides.findIndex((candidate) => candidate.slug === guide.slug);
  const previous = currentIndex > 0 ? guides[currentIndex - 1] : undefined;
  const next = currentIndex < guides.length - 1 ? guides[currentIndex + 1] : undefined;
  return (
    <Box sx={{ display: "grid", gap: 1.5, gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr" } }}>
      {previous ? (
        <Link href={`${collectionHref}/${previous.slug}`} style={{ color: "inherit", textDecoration: "none" }}>
          <Card sx={{ height: "100%" }} variant="outlined">
            <CardActionArea component="div" sx={{ height: "100%" }}>
              <CardContent>
                <Stack direction="row" spacing={1} sx={{ alignItems: "center" }}>
                  <ArrowBackRoundedIcon color="primary" fontSize="small" />
                  <Box>
                    <Typography color="text.secondary" variant="caption">Previous guide</Typography>
                    <Typography sx={{ fontWeight: 850 }} variant="body2">{previous.title}</Typography>
                  </Box>
                </Stack>
              </CardContent>
            </CardActionArea>
          </Card>
        </Link>
      ) : <Box />}
      {next ? (
        <Link href={`${collectionHref}/${next.slug}`} style={{ color: "inherit", textDecoration: "none" }}>
          <Card sx={{ height: "100%" }} variant="outlined">
            <CardActionArea component="div" sx={{ height: "100%" }}>
              <CardContent>
                <Stack direction="row" spacing={1} sx={{ alignItems: "center", justifyContent: "flex-end", textAlign: "right" }}>
                  <Box>
                    <Typography color="text.secondary" variant="caption">Next guide</Typography>
                    <Typography sx={{ fontWeight: 850 }} variant="body2">{next.title}</Typography>
                  </Box>
                  <ArrowForwardRoundedIcon color="primary" fontSize="small" />
                </Stack>
              </CardContent>
            </CardActionArea>
          </Card>
        </Link>
      ) : null}
    </Box>
  );
}

export function HelpArticle({
  actions = [],
  collectionHref,
  collectionTitle,
  guide,
  guides,
}: {
  actions?: readonly HelpArticleAction[];
  collectionHref: string;
  collectionTitle: string;
  guide: HelpGuide;
  guides: readonly HelpGuide[];
}) {
  return (
    <DashboardPage>
      <Box>
        <Breadcrumbs aria-label="Help breadcrumb" sx={{ mb: 1.25 }}>
          <Link href="/help">Help Center</Link>
          <Link href={collectionHref}>{collectionTitle}</Link>
          <Typography color="text.primary">{guide.title}</Typography>
        </Breadcrumbs>
        <Typography component="h1" variant="h1">{guide.title}</Typography>
        <Typography color="text.secondary" sx={{ maxWidth: 820, mt: 1 }} variant="body1">
          {guide.description}
        </Typography>
        {actions.length > 0 ? (
          <Stack direction={{ xs: "column", sm: "row" }} spacing={1.25} sx={{ mt: 2 }}>
            {actions.map((action) => (
              <Link href={action.href} key={action.href} style={{ textDecoration: "none" }}>
                <Button component="span" fullWidth variant={action.variant ?? "outlined"}>
                  {action.label}
                </Button>
              </Link>
            ))}
          </Stack>
        ) : null}
      </Box>

      <Card variant="outlined">
        <CardContent sx={{ p: { xs: 2, sm: 2.5 }, "&:last-child": { pb: { xs: 2, sm: 2.5 } } }}>
          <Typography component="h2" variant="h2">In this guide</Typography>
          <Stack direction="row" sx={{ flexWrap: "wrap", gap: 1, mt: 1.5 }}>
            {guide.sections.map((section) => (
              <Link href={`#${section.id}`} key={section.id} style={{ textDecoration: "none" }}>
                <Chip component="span" label={section.title} variant="outlined" />
              </Link>
            ))}
          </Stack>
        </CardContent>
      </Card>

      <Stack divider={<Divider flexItem />} spacing={3}>
        {guide.sections.map((section) => (
          <Box component="section" id={section.id} key={section.id} sx={{ scrollMarginTop: 96 }}>
            <Typography component="h2" variant="h2">{section.title}</Typography>
            <Typography color="text.secondary" sx={{ mt: 0.65 }} variant="body2">{section.summary}</Typography>
            <Stack spacing={1.75} sx={{ mt: 1.75 }}>
              {section.blocks.map((block, index) => (
                <ArticleBlock block={block} key={`${section.id}-${block.kind}-${index}`} />
              ))}
            </Stack>
          </Box>
        ))}
      </Stack>

      <GuideNavigation
        collectionHref={collectionHref}
        guide={guide}
        guides={guides}
      />
    </DashboardPage>
  );
}
