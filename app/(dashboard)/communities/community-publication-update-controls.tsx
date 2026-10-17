"use client";
import Checkbox from "@mui/material/Checkbox";
import FormControlLabel from "@mui/material/FormControlLabel";
import Button from "@mui/material/Button";
import Stack from "@mui/material/Stack";
import TextField from "@mui/material/TextField";
import Typography from "@mui/material/Typography";
export function CommunityPublicationUpdateControls(){return <Stack spacing={1.5}><Typography color="text.secondary">Save changes updates TraderLink only. Select the channels above before explicitly updating Discord. An update announcement explains your changes and links to this page.</Typography><TextField label="What changed" name="changeSummary" multiline minRows={2} inputProps={{maxLength:1000}}/><Stack direction="row" sx={{flexWrap:"wrap",gap:1}}><Button name="discordAction" value="edit" type="submit" variant="outlined">Update existing Discord post</Button><Button name="discordAction" value="announce" type="submit" variant="outlined">Post an update to Discord</Button></Stack><details><summary>Retry an unconfirmed action</summary><FormControlLabel label="I checked the Discord channel and want to retry the unconfirmed action" control={<Checkbox name="confirmUncertainUpdate"/>}/></details><Typography color="text.secondary" variant="caption">An announcement requires an explanation. A new channel post does not guarantee a device notification. Save and Discord delivery results are reported separately.</Typography></Stack>;}
