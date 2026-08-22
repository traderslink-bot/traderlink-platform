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
import TableContainer from "@mui/material/TableContainer";
import TableHead from "@mui/material/TableHead";
import TableRow from "@mui/material/TableRow";
import Typography from "@mui/material/Typography";
import Link from "next/link";

import type { PublicHelpCollection } from "@/src/modules/help/public-help-content";
import type { HelpArticleBlock, HelpGuide } from "@/src/modules/help/help-guide-types";

const platformOrigin = "https://app.traderslink.pro";
const publicOrigin = "https://traderslink.pro";

function destinationHref(href: string): string {
  if (href.startsWith("/help")) return href;
  if (href.startsWith("/")) return `${platformOrigin}${href}`;
  return href;
}

function HelpBlock({ block }: { block: HelpArticleBlock }) {
  if (block.kind === "paragraph") return <Typography color="text.secondary">{block.text}</Typography>;
  if (block.kind === "bullets") return <Box component="ul" sx={{ color: "text.secondary", m: 0, pl: 2.75 }}>{block.items.map((item) => <Typography component="li" key={item} sx={{ mb: 0.75 }}>{item}</Typography>)}</Box>;
  if (block.kind === "steps") return <Stack spacing={1.25}>{block.items.map((item, index) => <Box key={item.title} sx={{ borderLeft: 3, borderColor: "primary.main", pl: 1.5, py: 0.25 }}><Typography sx={{ fontWeight: 850 }}>{`${index + 1}. ${item.title}`}</Typography><Typography color="text.secondary" variant="body2">{item.text}</Typography></Box>)}</Stack>;
  if (block.kind === "callout") {
    const warning = block.tone === "warning";
    return <Box sx={{ bgcolor: warning ? "rgba(237, 108, 2, 0.07)" : "rgba(25, 118, 210, 0.06)", border: 1, borderColor: warning ? "rgba(237, 108, 2, 0.28)" : "rgba(25, 118, 210, 0.22)", borderRadius: 1.5, p: 1.75 }}><Stack direction="row" spacing={1}><Box sx={{ pt: 0.2 }}>{warning ? <WarningAmberRoundedIcon color="warning" fontSize="small" /> : <InfoOutlinedIcon color="primary" fontSize="small" />}</Box><Box><Typography sx={{ fontWeight: 850 }} variant="body2">{block.title}</Typography><Typography color="text.secondary" sx={{ mt: 0.35 }} variant="body2">{block.text}</Typography></Box></Stack></Box>;
  }
  if (block.kind === "link") return <Box><Typography color="text.secondary">{block.text}</Typography><Button component={Link} endIcon={<ArrowForwardRoundedIcon />} href={destinationHref(block.href)} sx={{ mt: 1 }} variant="outlined">{block.label}</Button></Box>;
  return <TableContainer component={Paper} variant="outlined" sx={{ maxWidth: "100%" }}><Table size="small" sx={{ minWidth: Math.max(520, 150 + Math.max(0, block.columns.length - 1) * 220) }}><TableHead><TableRow>{block.columns.map((column) => <TableCell key={column} sx={{ bgcolor: "rgba(1, 30, 86, 0.045)", fontWeight: 850 }}>{column}</TableCell>)}</TableRow></TableHead><TableBody>{block.rows.map((row, rowIndex) => <TableRow key={`${rowIndex}-${row[0]}`}>{row.map((cell, cellIndex) => <TableCell key={`${cellIndex}-${cell}`} sx={{ color: cellIndex === 0 ? "text.primary" : "text.secondary", fontWeight: cellIndex === 0 ? 750 : 400, minWidth: cellIndex === 0 ? 150 : 220, verticalAlign: "top" }}>{cell}</TableCell>)}</TableRow>)}</TableBody></Table></TableContainer>;
}

export function HelpCollectionPage({ collection }: { collection: PublicHelpCollection }) {
  const jsonLd = JSON.stringify({ "@context": "https://schema.org", "@type": "BreadcrumbList", itemListElement: [{ "@type": "ListItem", position: 1, name: "Help Center", item: `${publicOrigin}/help` }, { "@type": "ListItem", position: 2, name: collection.title, item: `${publicOrigin}${collection.href}` }] }).replace(/</g, "\\u003c");
  return <Box sx={{ mx: "auto", pb: 7, pt: { xs: 3, sm: 5 }, px: { xs: 2, sm: 3 }, width: "100%", maxWidth: 1120 }}><script dangerouslySetInnerHTML={{ __html: jsonLd }} type="application/ld+json" /><Breadcrumbs aria-label="Help breadcrumb" sx={{ mb: 1.5 }}><Link href="/help">Help Center</Link><Typography color="text.primary">{collection.title}</Typography></Breadcrumbs><Typography component="h1" variant="h1">{collection.title}</Typography><Typography color="text.secondary" sx={{ maxWidth: 760, mt: 1 }}>{collection.summary}</Typography><Button component={Link} href={`${platformOrigin}/workspace`} sx={{ mt: 2 }} variant="contained">Open Trade Tracker</Button><Box sx={{ display: "grid", gap: 1.5, gridTemplateColumns: { xs: "1fr", md: "1fr 1fr" }, mt: 4 }}>{collection.guides.map((guide, index) => <Link href={`${collection.href}/${guide.slug}`} key={guide.slug} style={{ color: "inherit", textDecoration: "none" }}><Card sx={{ height: "100%" }} variant="outlined"><CardActionArea component="div" sx={{ height: "100%" }}><CardContent><Stack direction="row" spacing={1.25}><Box sx={{ alignItems: "center", bgcolor: "rgba(1, 30, 86, 0.08)", borderRadius: "50%", color: "primary.main", display: "flex", flexShrink: 0, fontSize: 13, fontWeight: 900, height: 30, justifyContent: "center", width: 30 }}>{index + 1}</Box><Box><Typography sx={{ fontWeight: 850 }}>{guide.title}</Typography><Typography color="text.secondary" sx={{ mt: 0.5 }} variant="body2">{guide.description}</Typography></Box></Stack></CardContent></CardActionArea></Card></Link>)}</Box></Box>;
}

export function HelpGuidePage({ collection, guide }: { collection: PublicHelpCollection; guide: HelpGuide }) {
  const currentIndex = collection.guides.findIndex((candidate) => candidate.slug === guide.slug);
  const previous = currentIndex > 0 ? collection.guides[currentIndex - 1] : null;
  const next = currentIndex < collection.guides.length - 1 ? collection.guides[currentIndex + 1] : null;
  const jsonLd = JSON.stringify({ "@context": "https://schema.org", "@type": "BreadcrumbList", itemListElement: [{ "@type": "ListItem", position: 1, name: "Help Center", item: `${publicOrigin}/help` }, { "@type": "ListItem", position: 2, name: collection.title, item: `${publicOrigin}${collection.href}` }, { "@type": "ListItem", position: 3, name: guide.title, item: `${publicOrigin}${collection.href}/${guide.slug}` }] }).replace(/</g, "\\u003c");
  return <Box component="article" sx={{ mx: "auto", pb: 7, pt: { xs: 3, sm: 5 }, px: { xs: 2, sm: 3 }, width: "100%", maxWidth: 960 }}><script dangerouslySetInnerHTML={{ __html: jsonLd }} type="application/ld+json" /><Breadcrumbs aria-label="Help breadcrumb" sx={{ mb: 1.5 }}><Link href="/help">Help Center</Link><Link href={collection.href}>{collection.title}</Link><Typography color="text.primary">{guide.title}</Typography></Breadcrumbs><Typography component="h1" variant="h1">{guide.title}</Typography><Typography color="text.secondary" sx={{ maxWidth: 760, mt: 1 }}>{guide.description}</Typography><Button component={Link} href={`${platformOrigin}/workspace`} sx={{ mt: 2 }} variant="contained">Open Trade Tracker</Button><Card sx={{ mt: 4 }} variant="outlined"><CardContent><Typography component="h2" variant="h2">In this guide</Typography><Stack direction="row" sx={{ flexWrap: "wrap", gap: 1, mt: 1.5 }}>{guide.sections.map((section) => <Chip component="a" href={`#${section.id}`} key={section.id} label={section.title} sx={{ height: "auto", minHeight: 40, "& .MuiChip-label": { py: 0.75, whiteSpace: "normal" } }} variant="outlined" />)}</Stack></CardContent></Card><Stack divider={<Divider flexItem />} spacing={3} sx={{ mt: 4 }}>{guide.sections.map((section) => <Box component="section" id={section.id} key={section.id} sx={{ scrollMarginTop: 88 }}><Typography component="h2" variant="h2">{section.title}</Typography><Typography color="text.secondary" sx={{ mt: 0.65 }} variant="body2">{section.summary}</Typography><Stack spacing={1.75} sx={{ mt: 1.75 }}>{section.blocks.map((block, index) => <HelpBlock block={block} key={`${section.id}-${block.kind}-${index}`} />)}</Stack></Box>)}</Stack><Box sx={{ display: "grid", gap: 1.5, gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr" }, mt: 4 }}>{previous ? <Button component={Link} href={`${collection.href}/${previous.slug}`} startIcon={<ArrowBackRoundedIcon />} variant="outlined">{previous.title}</Button> : <Box />}{next ? <Button component={Link} href={`${collection.href}/${next.slug}`} endIcon={<ArrowForwardRoundedIcon />} variant="outlined">{next.title}</Button> : null}</Box></Box>;
}
