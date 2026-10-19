import Button from "@mui/material/Button";

export function JournalUpgradeLink() {
  return <Button href="/plans?feature=journal.access" size="small" variant="contained" sx={{ alignSelf: "flex-start", mt: 1 }}>Explore Journal plans</Button>;
}
