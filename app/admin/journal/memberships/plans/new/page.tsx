import Button from "@mui/material/Button";
import { MembershipCheckbox } from "../../membership-checkbox";
import MenuItem from "@mui/material/MenuItem";
import Stack from "@mui/material/Stack";
import TextField from "@mui/material/TextField";
import type { Metadata } from "next";

import { readMembershipFeatures } from "@/src/modules/platform/server/membership/platform-membership-features";
import { withJournalAdminPageDatabase } from "@/src/modules/platform/server/administration/require-journal-admin-page";
import { MembershipForm } from "../../membership-form";
import { JournalAdminPage, JournalAdminPageHeader, JournalAdminPanel } from
  "../../../journal-admin-ui";
import { createMembershipPlanAction } from "../../membership-actions";

export const metadata: Metadata = { title: "New plan | Memberships" };

export default async function NewMembershipPlanPage() {
  const features = await withJournalAdminPageDatabase((database) => readMembershipFeatures(database));
  return (
    <JournalAdminPage>
      <JournalAdminPageHeader
        description=""
        eyebrow="Memberships"
        title="New plan"
      />
      <MembershipForm action={createMembershipPlanAction} label="Create draft">
        <Stack spacing={2.5}>
          <JournalAdminPanel title="Details">
            <Stack spacing={2}>
              <TextField label="Plan name" name="name" required />
              <TextField helperText="Lowercase letters, numbers and hyphens." label="Plan key" name="planKey" required />
              <TextField defaultValue="private" label="Visibility" name="visibility" select>
                <MenuItem value="public">Public</MenuItem>
                <MenuItem value="unlisted">Unlisted</MenuItem>
                <MenuItem value="private">Private</MenuItem>
              </TextField>
              <TextField label="Public description" minRows={3} multiline name="publicDescription" />
              <TextField label="Internal note" minRows={2} multiline name="internalNote" />
            </Stack>
          </JournalAdminPanel>
          <JournalAdminPanel title="Features">
            <Stack spacing={1.5}>
              {features.map((feature) => (
                <Stack direction={{ xs: "column", sm: "row" }} key={feature.key} sx={{ alignItems: { sm: "center" }, gap: 1.5, justifyContent: "space-between" }}>
                  <MembershipCheckbox name="features" value={feature.key} label={feature.label} />
                  {feature.kind === "limit" ? (
                    <TextField slotProps={{ htmlInput: { min: 0, step: 1 } }} label="Limit" helperText="Blank means unlimited." name={`limit:${feature.key}`} size="small" sx={{ width: { sm: 160 } }} type="number" />
                  ) : null}
                </Stack>
              ))}
            </Stack>
          </JournalAdminPanel>
          <Stack direction="row" spacing={1.5} sx={{ justifyContent: "flex-end" }}>
            <Button href="/admin/journal/memberships" variant="outlined">Cancel</Button>
          </Stack>
        </Stack>
      </MembershipForm>
    </JournalAdminPage>
  );
}
