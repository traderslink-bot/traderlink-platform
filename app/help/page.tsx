import ArrowForwardRoundedIcon from "@mui/icons-material/ArrowForwardRounded";
import Box from "@mui/material/Box";
import Card from "@mui/material/Card";
import CardActionArea from "@mui/material/CardActionArea";
import CardContent from "@mui/material/CardContent";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import type { Metadata } from "next";
import Link from "next/link";

import { HelpSearch } from "./_components/help-search";
import { HELP_SEARCH_RECORDS } from "@/src/modules/help/help-content-registry";
import { PUBLIC_HELP_COLLECTIONS } from "@/src/modules/help/public-help-content";

export const metadata: Metadata = { title: "Help Center | TradersLink", description: "Learn how to use TraderLink trade tracking, analytics, trading tools, account features and more.", alternates: { canonical: "/help" }, robots: { follow: true, index: true } };

export default function PublicHelpPage() {
  return <Box component="main" sx={{ mx: "auto", pb: 7, pt: { xs: 3, sm: 5 }, px: { xs: 2, sm: 3 }, width: "100%", maxWidth: 1120 }}><Typography component="h1" variant="h1">Help Center</Typography><Box sx={{ maxWidth: 760, mt: 2 }}><HelpSearch records={HELP_SEARCH_RECORDS} /></Box><Box sx={{ display: "grid", gap: 1.5, gridTemplateColumns: { xs: "1fr", md: "1fr 1fr" }, mt: 4 }}>{PUBLIC_HELP_COLLECTIONS.map((collection) => <Link href={collection.href} key={collection.id} style={{ color: "inherit", textDecoration: "none" }}><Card sx={{ height: "100%" }} variant="outlined"><CardActionArea component="div" sx={{ height: "100%" }}><CardContent><Stack direction="row" spacing={1.25} sx={{ alignItems: "flex-start", justifyContent: "space-between" }}><Box><Typography component="h2" variant="h2">{collection.title}</Typography><Typography color="text.secondary" sx={{ mt: 0.75 }} variant="body2">{collection.summary}</Typography></Box><ArrowForwardRoundedIcon color="primary" fontSize="small" /></Stack></CardContent></CardActionArea></Card></Link>)}</Box></Box>;
}
