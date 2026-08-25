"use client";

import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Chip from "@mui/material/Chip";
import FormControlLabel from "@mui/material/FormControlLabel";
import Stack from "@mui/material/Stack";
import Switch from "@mui/material/Switch";
import TextField from "@mui/material/TextField";
import Typography from "@mui/material/Typography";
import Link from "next/link";
import { useState } from "react";

import { COMMUNITY_PROFILE_TAGS, type CommunityProfileSettings } from "@/src/modules/community/contracts/community-watchlist-contracts";
import { saveCommunityProfileSettings } from "../../community/community-profile-actions";

export function CommunityProfileSettingsEditor({ initial }: { initial: CommunityProfileSettings }) {
  const [description, setDescription] = useState(initial.description);
  const [tags, setTags] = useState<readonly string[]>(initial.tags);
  const [visible, setVisible] = useState(initial.visible);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [handle, setHandle] = useState(initial.handle);

  const toggleTag = (tag: string) => {
    setTags((current) => current.includes(tag)
      ? current.filter((item) => item !== tag)
      : current.length < 6 ? [...current, tag] : current);
  };

  return <Stack spacing={2}>
    <Box>
      <Typography color="text.secondary" variant="caption">Discord name</Typography>
      <Typography sx={{ fontWeight: 800 }}>@{initial.discordUsername}</Typography>
    </Box>
    <TextField
      fullWidth
      helperText={`${description.length}/180`}
      label="Short description"
      minRows={3}
      multiline
      onChange={(event) => setDescription(event.target.value)}
      placeholder="A short note about the stocks and setups you follow."
      slotProps={{ htmlInput: { maxLength: 180 } }}
      value={description}
    />
    <Box>
      <Typography sx={{ fontWeight: 800 }} variant="body2">Profile tags</Typography>
      <Typography color="text.secondary" variant="caption">Choose up to 6 tags. These help people find your profile and are not shown on your watchlists.</Typography>
      <Stack direction="row" spacing={0.65} sx={{ flexWrap: "wrap", mt: 0.85, rowGap: 0.65 }}>
        {COMMUNITY_PROFILE_TAGS.map((tag) => {
          const selected = tags.includes(tag);
          return <Chip color={selected ? "primary" : "default"} disabled={!selected && tags.length >= 6} key={tag} label={tag} onClick={() => toggleTag(tag)} size="small" variant={selected ? "filled" : "outlined"} />;
        })}
      </Stack>
    </Box>
    <FormControlLabel control={<Switch checked={visible} onChange={(event) => setVisible(event.target.checked)} />} label="Show my Community profile" />
    <Stack direction={{ xs: "column", sm: "row" }} spacing={1} sx={{ alignItems: { sm: "center" } }}>
      <Button disabled={saving} onClick={async () => {
        setSaving(true);
        setMessage(null);
        const result = await saveCommunityProfileSettings({ description, tags, visible });
        setSaving(false);
        if (result.ok) setHandle(result.handle);
        setMessage(result.message);
      }} variant="contained">{saving ? "Saving..." : "Save Community profile"}</Button>
      {handle && visible ? <Link href={`/community/${handle}`} style={{ color: "#082b73", fontSize: "0.875rem", fontWeight: 800, textDecoration: "none" }}>View my profile</Link> : null}
    </Stack>
    {message ? <Typography color="text.secondary" role="status" variant="body2">{message}</Typography> : null}
  </Stack>;
}
