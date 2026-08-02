import {
  parseJournalAccountSelectionRef,
  type JournalAccountSelectionRef,
} from "../../contracts/journal-account-selection";
import { platformFailure } from "../database/platform-migration-contract";

export const TRADERLINK_JOURNAL_ACCOUNT_SELECTION_COOKIE =
  "traderlink_journal_account" as const;

export function readJournalAccountSelectionCookie(
  requestHeaders: Headers,
): JournalAccountSelectionRef | null {
  const encoded = requestHeaders.get("cookie");
  if (!encoded) return null;
  const prefix = `${TRADERLINK_JOURNAL_ACCOUNT_SELECTION_COOKIE}=`;
  const matches = encoded.split(";")
    .map((part) => part.trim())
    .filter((part) => part.startsWith(prefix))
    .map((part) => part.slice(prefix.length));
  if (matches.length === 0) return null;
  if (matches.length !== 1 || !matches[0]) {
    platformFailure("TRADERLINK_ACCOUNT_ACCESS_DENIED", {
      check: "journal_account_selection_cookie",
    });
  }
  return parseJournalAccountSelectionRef(matches[0]);
}

export function serializeJournalAccountSelectionCookie(
  selectionRef: JournalAccountSelectionRef,
): string {
  return [
    `${TRADERLINK_JOURNAL_ACCOUNT_SELECTION_COOKIE}=${selectionRef}`,
    "Path=/",
    "HttpOnly",
    "SameSite=Strict",
    "Max-Age=31536000",
  ].join("; ");
}
