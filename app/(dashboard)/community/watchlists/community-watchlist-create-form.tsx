"use client";

import AddRoundedIcon from "@mui/icons-material/AddRounded";
import DeleteOutlineRoundedIcon from "@mui/icons-material/DeleteOutlineRounded";
import SendRoundedIcon from "@mui/icons-material/SendRounded";
import Alert from "@mui/material/Alert";
import Box from "@mui/material/Box";
import Chip from "@mui/material/Chip";
import FormControlLabel from "@mui/material/FormControlLabel";
import IconButton from "@mui/material/IconButton";
import Stack from "@mui/material/Stack";
import Switch from "@mui/material/Switch";
import TextField from "@mui/material/TextField";
import Typography from "@mui/material/Typography";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useState, useTransition } from "react";

import {
  COMMUNITY_PROFILE_TAGS,
  COMMUNITY_WATCHLIST_TAGS,
  type CommunityTickerInput,
} from "@/src/modules/community/contracts/community-watchlist-contracts";
import { DashboardPage, DashboardPanel, DashboardPrimaryAction, DashboardSecondaryAction } from "../../../dashboard-template";
import { createCommunityWatchlist } from "./community-watchlist-actions";

type DraftTicker = CommunityTickerInput & Readonly<{ id: number }>;

function blankTicker(id: number, symbol = ""): DraftTicker {
  return { id, symbol, tags: [], whyWatching: "", plan: "", personalTarget: "", catalyst: "", catalystDate: null, postedReferencePrice: "" };
}

function TagPicker({ available, selected, onChange }: { available: readonly string[]; selected: readonly string[]; onChange: (next: readonly string[]) => void }) {
  const [customTag, setCustomTag] = useState("");
  const choices = [...new Set([...available, ...selected])];
  function addCustomTag(): void {
    const tag = customTag.trim().replace(/\s+/gu, " ");
    if (!tag || selected.some((item) => item.localeCompare(tag, undefined, { sensitivity: "accent" }) === 0) || selected.length >= 20) return;
    onChange([...selected, tag.slice(0, 48)]);
    setCustomTag("");
  }
  return <Stack spacing={0.85}>
    <Stack direction="row" spacing={0.75} sx={{ flexWrap: "wrap", rowGap: 0.75 }}>{choices.map((tag) => <Chip color={selected.includes(tag) ? "primary" : "default"} key={tag} label={tag} onClick={() => onChange(selected.includes(tag) ? selected.filter((item) => item !== tag) : [...selected, tag])} variant={selected.includes(tag) ? "filled" : "outlined"} />)}</Stack>
    <Stack direction="row" spacing={0.75} sx={{ alignItems: "center", maxWidth: 330 }}>
      <TextField inputProps={{ maxLength: 48 }} label="Create a tag" onChange={(event) => setCustomTag(event.target.value)} onKeyDown={(event) => { if (event.key === "Enter") { event.preventDefault(); addCustomTag(); } }} size="small" value={customTag} />
      <IconButton aria-label="Add custom tag" disabled={!customTag.trim() || selected.length >= 20} onClick={addCustomTag} size="small"><AddRoundedIcon /></IconButton>
    </Stack>
  </Stack>;
}

export function CommunityWatchlistCreateForm() {
  const router = useRouter();
  const [working, startTransition] = useTransition();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [profileTags, setProfileTags] = useState<readonly string[]>(["Small caps", "Premarket"]);
  const [watchlistTags, setWatchlistTags] = useState<readonly string[]>(["Small cap", "Premarket"]);
  const [tickerText, setTickerText] = useState("");
  const [tickers, setTickers] = useState<readonly DraftTicker[]>([]);
  const [sendDiscord, setSendDiscord] = useState(true);
  const [message, setMessage] = useState<string | null>(null);
  const tickerCount = useMemo(() => tickers.filter((ticker) => ticker.symbol.trim()).length, [tickers]);

  function addTicker(): void {
    const symbol = tickerText.trim().toUpperCase();
    if (!symbol || tickers.some((ticker) => ticker.symbol === symbol)) return;
    setTickers((current) => [...current, blankTicker(Date.now(), symbol)]);
    setTickerText("");
  }
  function updateTicker(id: number, patch: Partial<CommunityTickerInput>): void {
    setTickers((current) => current.map((ticker) => ticker.id === id ? { ...ticker, ...patch } : ticker));
  }
  function save(publish: boolean): void {
    setMessage(null);
    startTransition(async () => {
      const result = await createCommunityWatchlist({
        title, description, profileTags, tags: watchlistTags,
        tickers: tickers.map((ticker) => ({
          symbol: ticker.symbol,
          tags: ticker.tags,
          whyWatching: ticker.whyWatching,
          plan: ticker.plan,
          personalTarget: ticker.personalTarget,
          catalyst: ticker.catalyst,
          catalystDate: ticker.catalystDate,
          postedReferencePrice: ticker.postedReferencePrice,
        })), publish, sendDiscord: publish && sendDiscord,
      });
      if (!result.ok) { setMessage(result.message); return; }
      setMessage(result.message);
      router.push(publish ? result.href : "/community/watchlists");
      router.refresh();
    });
  }
  return (
    <DashboardPage>
      <Stack direction={{ xs: "column", sm: "row" }} spacing={1} sx={{ alignItems: { sm: "center" }, justifyContent: "space-between" }}>
        <Typography component="h1" variant="h1">Create watchlist</Typography>
        <DashboardSecondaryAction component={Link} href="/community/watchlists">Back to watchlists</DashboardSecondaryAction>
      </Stack>
      <DashboardPanel title="Watchlist details">
        <Stack spacing={2}>
          <TextField fullWidth label="Watchlist title" onChange={(event) => setTitle(event.target.value)} required value={title} />
          <TextField fullWidth label="Short description" minRows={3} multiline onChange={(event) => setDescription(event.target.value)} placeholder="What makes this list worth checking today?" value={description} />
          <Box><Typography color="text.secondary" variant="caption">Watchlist tags</Typography><Box sx={{ mt: 0.75 }}><TagPicker available={COMMUNITY_WATCHLIST_TAGS} onChange={setWatchlistTags} selected={watchlistTags} /></Box></Box>
          <Box><Typography color="text.secondary" variant="caption">Your profile tags</Typography><Box sx={{ mt: 0.75 }}><TagPicker available={COMMUNITY_PROFILE_TAGS} onChange={setProfileTags} selected={profileTags} /></Box></Box>
        </Stack>
      </DashboardPanel>
      <DashboardPanel title="Tickers">
        <Stack spacing={1.5}>
          <Stack direction={{ xs: "column", sm: "row" }} spacing={1}>
            <TextField fullWidth label="Ticker symbol" onChange={(event) => setTickerText(event.target.value)} onKeyDown={(event) => { if (event.key === "Enter") { event.preventDefault(); addTicker(); } }} placeholder="Enter a ticker" value={tickerText} />
            <DashboardSecondaryAction onClick={addTicker} startIcon={<AddRoundedIcon />}>Add ticker</DashboardSecondaryAction>
          </Stack>
          {tickers.map((ticker) => <Box key={ticker.id} sx={{ border: 1, borderColor: "divider", borderRadius: 2, p: { xs: 1.5, sm: 2 } }}><Stack spacing={1.25}>
            <Stack direction="row" sx={{ alignItems: "center", justifyContent: "space-between" }}><Typography sx={{ fontWeight: 820 }}>{ticker.symbol}</Typography><IconButton aria-label={`Remove ${ticker.symbol}`} onClick={() => setTickers((current) => current.filter((item) => item.id !== ticker.id))}><DeleteOutlineRoundedIcon /></IconButton></Stack>
            <Box><Typography color="text.secondary" variant="caption">Ticker tags</Typography><Box sx={{ mt: 0.5 }}><TagPicker available={COMMUNITY_WATCHLIST_TAGS} onChange={(tags) => updateTicker(ticker.id, { tags })} selected={ticker.tags ?? []} /></Box></Box>
            <TextField fullWidth label="Why I am watching" minRows={2} multiline onChange={(event) => updateTicker(ticker.id, { whyWatching: event.target.value })} value={ticker.whyWatching ?? ""} />
            <TextField fullWidth label="My plan" minRows={2} multiline onChange={(event) => updateTicker(ticker.id, { plan: event.target.value })} value={ticker.plan ?? ""} />
            <Stack direction={{ xs: "column", sm: "row" }} spacing={1}><TextField fullWidth label="Personal target" onChange={(event) => updateTicker(ticker.id, { personalTarget: event.target.value })} value={ticker.personalTarget ?? ""} /><TextField fullWidth label="Upcoming catalyst" onChange={(event) => updateTicker(ticker.id, { catalyst: event.target.value })} value={ticker.catalyst ?? ""} /><TextField fullWidth label="Catalyst date" onChange={(event) => updateTicker(ticker.id, { catalystDate: event.target.value || null })} slotProps={{ inputLabel: { shrink: true } }} type="date" value={ticker.catalystDate ?? ""} /></Stack>
            <TextField fullWidth label="Posted reference price" onChange={(event) => updateTicker(ticker.id, { postedReferencePrice: event.target.value })} placeholder="Trader-entered, for example $3.82" value={ticker.postedReferencePrice ?? ""} />
          </Stack></Box>)}
        </Stack>
      </DashboardPanel>
      <DashboardPanel title="Share when ready">
        <Stack spacing={1.5}>
          <FormControlLabel control={<Switch checked={sendDiscord} onChange={(event) => setSendDiscord(event.target.checked)} />} label="Send the announcement to the private Discord channel when I publish" />
          <Typography color="text.secondary" variant="body2">The post shows your handle, watchlist title, symbol count and a link back to the app.</Typography>
          {message ? <Alert severity={message.includes("could not") ? "error" : "success"}>{message}</Alert> : null}
          <Stack direction={{ xs: "column", sm: "row" }} spacing={1}><DashboardSecondaryAction disabled={working || tickerCount === 0 || !title.trim()} onClick={() => save(false)}>{working ? "Saving..." : "Save draft"}</DashboardSecondaryAction><DashboardPrimaryAction disabled={working || tickerCount === 0 || !title.trim()} onClick={() => save(true)} startIcon={<SendRoundedIcon />}>{working ? "Publishing..." : "Publish watchlist"}</DashboardPrimaryAction></Stack>
        </Stack>
      </DashboardPanel>
    </DashboardPage>
  );
}
