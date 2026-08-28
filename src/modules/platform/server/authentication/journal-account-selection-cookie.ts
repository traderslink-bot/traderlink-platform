import {
  parseJournalAccountSelectionRef,
  type JournalAccountSelectionRef,
} from "../../contracts/journal-account-selection";
import { platformFailure } from "../database/platform-migration-contract";

export const TRADERLINK_JOURNAL_ACCOUNT_SELECTION_COOKIE =
  "traderlink_journal_account" as const;

export const TRADERLINK_JOURNAL_DEMO_RETURN_ACCOUNT_SELECTION_COOKIE =
  "traderlink_journal_demo_return_account" as const;

function readJournalAccountSelectionCookieValue(
  requestHeaders: Headers,
  cookieName: string,
): JournalAccountSelectionRef | null {
  const encoded = requestHeaders.get("cookie");
  if (!encoded) return null;
  const prefix = `${cookieName}=`;
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

export function readJournalAccountSelectionCookie(
  requestHeaders: Headers,
): JournalAccountSelectionRef | null {
  return readJournalAccountSelectionCookieValue(
    requestHeaders,
    TRADERLINK_JOURNAL_ACCOUNT_SELECTION_COOKIE,
  );
}

export function readJournalDemoReturnAccountSelectionCookie(
  requestHeaders: Headers,
): JournalAccountSelectionRef | null {
  return readJournalAccountSelectionCookieValue(
    requestHeaders,
    TRADERLINK_JOURNAL_DEMO_RETURN_ACCOUNT_SELECTION_COOKIE,
  );
}

function serializeJournalAccountSelectionCookieValue(
  selectionRef: JournalAccountSelectionRef,
  cookieName: string,
): string {
  return [
    `${cookieName}=${selectionRef}`,
    "Path=/",
    "HttpOnly",
    "SameSite=Strict",
    "Max-Age=31536000",
  ].join("; ");
}

export function serializeJournalAccountSelectionCookie(
  selectionRef: JournalAccountSelectionRef,
): string {
  return serializeJournalAccountSelectionCookieValue(
    selectionRef,
    TRADERLINK_JOURNAL_ACCOUNT_SELECTION_COOKIE,
  );
}

export function serializeJournalDemoReturnAccountSelectionCookie(
  selectionRef: JournalAccountSelectionRef,
): string {
  return serializeJournalAccountSelectionCookieValue(
    selectionRef,
    TRADERLINK_JOURNAL_DEMO_RETURN_ACCOUNT_SELECTION_COOKIE,
  );
}
