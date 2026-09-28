import CheckCircleRoundedIcon from "@mui/icons-material/CheckCircleRounded";
import Box from "@mui/material/Box";
import Chip from "@mui/material/Chip";
import Container from "@mui/material/Container";
import Paper from "@mui/material/Paper";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import Button from "@mui/material/Button";

import type { PlatformMembershipCatalogPlan } from
  "@/src/modules/platform/server/membership/platform-membership-catalog-repository";
import { membershipOfferPrice, formatMembershipMoney } from "@/src/modules/platform/contracts/platform-membership-pricing";
import { MembershipForm } from "../admin/journal/memberships/membership-form";
import { selectMembershipAction } from "./checkout-actions";

export function PlanCatalog({
  plans,
  privateOffer = false,
  secret,
  title = "Plans",
}: {
  plans: readonly PlatformMembershipCatalogPlan[];
  privateOffer?: boolean;
  secret?: string;
  title?: string;
}) {
  return (
    <Box component="main" sx={{ bgcolor: "#f5f7fb", minHeight: "70vh", py: { xs: 6, md: 9 } }}>
      <Container maxWidth="lg">
        <Stack spacing={4}>
          <Stack spacing={1} sx={{ maxWidth: 760 }}>
            {privateOffer ? <Chip color="primary" label="Private offer" sx={{ alignSelf: "flex-start" }} /> : null}
            <Typography component="h1" variant="h1">{title}</Typography>
            <Stack direction="row" spacing={2} sx={{ pt: 1 }}>
              <Button href={`/api/auth/discord/login?returnTo=${encodeURIComponent(secret ? `/plans/invite/${secret}` : "/plans")}`} variant="outlined">Sign in</Button>
              <Button href="/account/membership" variant="text">Plan &amp; billing</Button>
            </Stack>
          </Stack>
          {plans.length === 0 ? (
            <Paper variant="outlined" sx={{ borderRadius: 3, p: { xs: 3, md: 5 } }}>
              <Typography component="h2" variant="h2">No plans are available</Typography>
              <Typography color="text.secondary" sx={{ mt: 1 }}>
                There are no active offers on this page right now.
              </Typography>
            </Paper>
          ) : (
            <Box sx={{ display: "grid", gap: 2.5, gridTemplateColumns: { xs: "1fr", md: "repeat(2, minmax(0, 1fr))", lg: "repeat(3, minmax(0, 1fr))" } }}>
              {plans.map((plan) => (
                <Paper key={plan.planVersionId} variant="outlined" sx={{ borderRadius: 3, display: "flex", flexDirection: "column", p: 3 }}>
                  <Typography component="h2" variant="h2">{plan.name}</Typography>
                  {plan.description ? <Typography color="text.secondary" sx={{ mt: 1 }}>{plan.description}</Typography> : null}
                  <Stack spacing={1.25} sx={{ my: 3 }}>
                    {plan.features.map((feature) => (
                      <Stack direction="row" key={`${feature.label}-${feature.limitValue ?? "included"}`} spacing={1} sx={{ alignItems: "center" }}>
                        <CheckCircleRoundedIcon color="success" fontSize="small" />
                        <Typography variant="body2">
                          {feature.label}{feature.limitValue === null ? feature.kind === "limit" ? ": Unlimited" : "" : `: ${feature.limitValue}`}
                        </Typography>
                      </Stack>
                    ))}
                  </Stack>
                  <Stack spacing={1.5} sx={{ mt: "auto" }}>
                    {plan.offers.map((offer) => (
                      <Box key={offer.offerId} sx={{ borderTop: 1, borderColor: "divider", pt: 2 }}>
                        <Typography sx={{ fontSize: "1.15rem", fontWeight: 850 }}>{membershipOfferPrice(offer)}</Typography>
                        <Typography color="text.secondary" variant="caption">{offer.name}</Typography>
                        {offer.accessDurationDays ? <Typography variant="body2">Includes {offer.accessDurationDays} days of access.</Typography> : null}
                        {!offer.automaticConfirmation && offer.billingKind !== "free" ? <Typography variant="body2">Payment uses {offer.providerLabel}. The owner confirms access after payment.</Typography> : null}
                        <MembershipForm action={selectMembershipAction} label={offer.billingKind === "free" ? "Get access" : "Choose this plan"}>
                          <input type="hidden" name="offerId" value={offer.offerId} />
                          {secret ? <input type="hidden" name="secret" value={secret} /> : null}
                        </MembershipForm>
                        {offer.trials.map((trial) => <Box key={trial.id} sx={{ mt: 2 }}>
                          <Typography>{trial.name} · {trial.durationDays} days · {trial.amount === 0 ? "Free" : formatMembershipMoney(trial.amount, offer.currency)}</Typography>
                          <Typography variant="body2">{offer.billingKind === "recurring" && (trial.amount > 0 || trial.paymentMethodRequired)
                            ? `Renews after the trial: ${membershipOfferPrice({ ...offer, initialAmountMinor: offer.renewalAmountMinor })}`
                            : "Access ends when the trial ends."}</Typography>
                          <MembershipForm action={selectMembershipAction} label="Start trial">
                            <input type="hidden" name="offerId" value={offer.offerId} /><input type="hidden" name="trialCampaignId" value={trial.id} />
                            {secret ? <input type="hidden" name="secret" value={secret} /> : null}
                          </MembershipForm>
                        </Box>)}
                      </Box>
                    ))}
                  </Stack>
                </Paper>
              ))}
            </Box>
          )}
        </Stack>
      </Container>
    </Box>
  );
}
