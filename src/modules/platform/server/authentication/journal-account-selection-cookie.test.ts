import {
  parseJournalAccountSelectionRef,
} from "../../contracts/journal-account-selection";
import {
  readJournalAccountSelectionCookie,
  serializeJournalAccountSelectionCookie,
  TRADERLINK_JOURNAL_ACCOUNT_SELECTION_COOKIE,
} from "./journal-account-selection-cookie";

const selectionRef = parseJournalAccountSelectionRef("a".repeat(64));

describe("Journal account selection cookie", () => {
  it("reads one exact opaque selection and ignores unrelated cookies", () => {
    const headers = new Headers({
      cookie: `theme=light; ${TRADERLINK_JOURNAL_ACCOUNT_SELECTION_COOKIE}=${selectionRef}`,
    });
    expect(readJournalAccountSelectionCookie(headers)).toBe(selectionRef);
    expect(readJournalAccountSelectionCookie(new Headers())).toBeNull();
  });

  it("rejects malformed or duplicated selection cookies", () => {
    expect(() => readJournalAccountSelectionCookie(new Headers({
      cookie: `${TRADERLINK_JOURNAL_ACCOUNT_SELECTION_COOKIE}=not-valid`,
    }))).toThrowError("TRADERLINK_ACCOUNT_ACCESS_DENIED");
    expect(() => readJournalAccountSelectionCookie(new Headers({
      cookie: [
        `${TRADERLINK_JOURNAL_ACCOUNT_SELECTION_COOKIE}=${selectionRef}`,
        `${TRADERLINK_JOURNAL_ACCOUNT_SELECTION_COOKIE}=${"b".repeat(64)}`,
      ].join("; "),
    }))).toThrowError("TRADERLINK_ACCOUNT_ACCESS_DENIED");
  });

  it("serializes a local-only HttpOnly strict path-wide cookie", () => {
    expect(serializeJournalAccountSelectionCookie(selectionRef)).toBe(
      `${TRADERLINK_JOURNAL_ACCOUNT_SELECTION_COOKIE}=${selectionRef}; Path=/; HttpOnly; SameSite=Strict; Max-Age=31536000`,
    );
  });
});
