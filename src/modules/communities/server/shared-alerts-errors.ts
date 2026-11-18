import { SHARED_ALERT_BODY_MAX_LENGTH } from "../contracts/shared-alerts-contracts";

export const SHARED_ALERT_ERRORS = {
  not_owner: "Only the verified owner of this connected community can use Shared alerts.",
  not_found: "This sharing request is not available to this community.",
  changed: "The request has changed. Reload it and review the current terms.",
  unavailable: "This community is not currently available for sharing requests.",
  blocked: "This community is not accepting sharing requests from your community.",
  duplicate: "A sharing request or connection already exists in this direction. Open Requests or Connections to continue. Your new message has not been sent.",
  request_limit: "You have reached the request limit: 10 requests per hour or 3 to the same community in 24 hours. Use an existing request or try again after that window. Withdrawn requests still count toward this limit.",
  limit: "Please wait before sending another request or message.",
  publishers_required: "Select at least one analyst with Publish alerts permission before sending or accepting this offer.",
  body_too_long: `Alert text must be ${SHARED_ALERT_BODY_MAX_LENGTH} characters or fewer.`,
  invalid: "Check the request, agreement and receiving channel, then try again.",
  discord_unavailable: "Discord ownership or channels could not be verified. Refresh Discord and try again.",
  channel_unavailable: "Choose a channel in the receiving server where the bot can view and send messages.",
} as const;

export type SharedAlertErrorCode = keyof typeof SHARED_ALERT_ERRORS;
export class SharedAlertError extends Error {
  constructor(readonly code: SharedAlertErrorCode) { super(SHARED_ALERT_ERRORS[code]); }
}
