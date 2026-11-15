import { randomUUID } from "node:crypto";
import { existsSync, mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { DEFAULT_DEFINITION, type SavedScreen } from "./contracts";
import { readSaved, writeSaved } from "./saved-store";
import { COMMUNITY_PAGE_SIZE } from "./sharing-contracts";
import { changeShare, parseShareCommand, readCommunityPage, readSharedScreen, readShareState, removeScreenShares } from "./sharing-store";

const author = "member-one";
const recipient = "member-two";
let directory: string;
let saves: string;

const sourceScreen = (price = 25): SavedScreen => ({
  id: randomUUID(), name: "Price and volume", definition: {
    ...DEFAULT_DEFINITION, rules: [{ metric: "price", operator: "gte", value: price }, { metric: "volume", operator: "gte", value: 250_000 }],
  },
});

beforeEach(() => {
  directory = mkdtempSync(join(tmpdir(), "stock-screen-sharing-"));
  saves = join(directory, "saved");
});

afterEach(() => { rmSync(directory, { recursive: true, force: true }); });

describe("member stock screener sharing", () => {
  it("publishes a private member link, selectively lists it, and serves configuration only", () => {
    expect(readCommunityPage(directory, null)).toEqual({ screens: [], next: null });
    expect(existsSync(join(directory, "shared.sqlite"))).toBe(false);
    const source = sourceScreen();
    const saved = writeSaved(saves, author, { revision: 0, defaultId: null, screens: [source] });
    const shared = changeShare(directory, author, "Member One", {
      screenId: source.id, expectedId: null, operation: "publish", revision: saved.revision, listed: false,
    })!;
    expect(shared).toEqual({ id: shared.id, name: source.name, author: "Member One", definition: source.definition, listed: false });
    expect(readSharedScreen(directory, shared.id)).toEqual(shared);
    expect(readCommunityPage(directory, null).screens).toEqual([]);
    expect(readShareState(directory, recipient, source.id)).toBeNull();
    expect(() => changeShare(directory, recipient, "Member Two", {
      screenId: source.id, expectedId: shared.id, operation: "revoke",
    })).toThrow("screen_missing");
    // A colliding saved ID under another account grants no management access.
    writeSaved(saves, recipient, { revision: 0, defaultId: null, screens: [source] });
    expect(() => changeShare(directory, recipient, "Member Two", {
      screenId: source.id, expectedId: shared.id, operation: "visibility", listed: true,
    })).toThrow("share_conflict");
    const listed = changeShare(directory, author, "Member One", {
      screenId: source.id, expectedId: shared.id, operation: "visibility", listed: true,
    });
    expect(readCommunityPage(directory, null).screens).toEqual([listed]);
    changeShare(directory, author, "Member One", { screenId: source.id, expectedId: shared.id, operation: "visibility", listed: false });
    expect(readCommunityPage(directory, null).screens).toEqual([]);
    expect(readSharedScreen(directory, shared.id)).toEqual(shared);
  });

  it("pins the shared version and keeps a separately saved copy after replacement and revocation", () => {
    const source = sourceScreen();
    const saved = writeSaved(saves, author, { revision: 0, defaultId: null, screens: [source] });
    const shared = changeShare(directory, author, null, {
      screenId: source.id, expectedId: null, operation: "publish", revision: saved.revision, listed: true,
    })!;
    const copy = { id: randomUUID(), name: "My independent copy", definition: readSharedScreen(directory, shared.id)!.definition };
    writeSaved(saves, recipient, { revision: 0, defaultId: null, screens: [copy] });
    const updated = { ...sourceScreen(50), id: source.id };
    const savedUpdate = writeSaved(saves, author, { ...saved, screens: [updated] });
    expect(readSharedScreen(directory, shared.id)?.definition).toEqual(source.definition);
    expect(() => changeShare(directory, author, null, {
      screenId: source.id, expectedId: shared.id, operation: "publish", revision: saved.revision, listed: true,
    })).toThrow("share_conflict");
    const newShare = changeShare(directory, author, null, {
      screenId: source.id, expectedId: shared.id, operation: "publish", revision: savedUpdate.revision, listed: true,
    })!;
    expect(newShare.id).not.toBe(shared.id);
    expect(readSharedScreen(directory, shared.id)).toBeNull();
    expect(readSharedScreen(directory, newShare.id)?.definition).toEqual(updated.definition);
    changeShare(directory, author, null, { screenId: source.id, expectedId: newShare.id, operation: "revoke" });
    expect(readSharedScreen(directory, newShare.id)).toBeNull();
    expect(readCommunityPage(directory, null).screens).toEqual([]);
    expect(readSaved(saves, recipient).screens).toEqual([copy]);
  });

  it("rejects personal ticker lists and ignores private fields in an all-stocks saved screen", () => {
    const all = sourceScreen();
    all.definition.tickers = ["PRIVATE"];
    const list = sourceScreen();
    list.definition = { ...list.definition, universe: "list", tickers: ["PRIVATE"] };
    const saved = writeSaved(saves, author, { revision: 0, defaultId: null, screens: [all, list] });
    expect(() => changeShare(directory, author, null, {
      screenId: list.id, expectedId: null, operation: "publish", revision: saved.revision, listed: true,
    })).toThrow("private_tickers");
    const shared = changeShare(directory, author, null, {
      screenId: all.id, expectedId: null, operation: "publish", revision: saved.revision, listed: true,
    });
    expect(shared?.definition.tickers).toEqual([]);
    expect(() => parseShareCommand({ screenId: "../private", operation: "revoke", expectedId: null })).toThrow("invalid_share");
  });

  it("hides an old share if its source uses My tickers even when the catalog still has the link", () => {
    const source = sourceScreen();
    const saved = writeSaved(saves, author, { revision: 0, defaultId: null, screens: [source] });
    const shared = changeShare(directory, author, null, {
      screenId: source.id, expectedId: null, operation: "publish", revision: saved.revision, listed: true,
    })!;
    const personal = { ...source, definition: { ...source.definition, universe: "list" as const, tickers: ["PRIVATE"] } };
    writeSaved(saves, author, { ...saved, screens: [personal] });
    expect.soft(readSharedScreen(directory, shared.id)).toBeNull();
    expect.soft(readShareState(directory, author, source.id)).toBeNull();
    expect.soft(readCommunityPage(directory, null).screens).toEqual([]);
    expect(() => changeShare(directory, author, null, {
      screenId: source.id, expectedId: shared.id, operation: "visibility", listed: true,
    })).toThrow("private_tickers");
  });

  it("pages the gallery and hides a preset immediately when its private source is deleted", () => {
    const screens = Array.from({ length: COMMUNITY_PAGE_SIZE + 1 }, () => sourceScreen());
    const saved = writeSaved(saves, author, { revision: 0, defaultId: null, screens });
    const published = screens.map(screen => changeShare(directory, author, null, {
      screenId: screen.id, expectedId: null, operation: "publish", revision: saved.revision, listed: true,
    })!);
    const first = readCommunityPage(directory, null);
    expect(first.screens).toHaveLength(COMMUNITY_PAGE_SIZE);
    expect(first.next).not.toBeNull();
    const last = readCommunityPage(directory, first.next);
    expect(last.next).toBeNull();
    expect(new Set([...first.screens, ...last.screens].map(screen => screen.id))).toEqual(new Set(published.map(screen => screen.id)));
    expect(() => readCommunityPage(directory, "bad.cursor")).toThrow("invalid_page");
    const afterDelete = writeSaved(saves, author, { ...saved, screens: screens.slice(1) });
    expect(readSharedScreen(directory, published[0].id)).toBeNull();
    removeScreenShares(directory, author, [screens[0].id]);
    expect(readCommunityPage(directory, null).screens).toHaveLength(COMMUNITY_PAGE_SIZE);
    writeSaved(saves, author, { ...afterDelete, screens });
    expect(readSharedScreen(directory, published[0].id)).toBeNull();
  });
});
