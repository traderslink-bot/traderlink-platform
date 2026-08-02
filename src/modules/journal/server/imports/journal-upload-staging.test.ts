import { existsSync, mkdtempSync, readFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

import { withStagedJournalUpload } from "./journal-upload-staging";

describe("Journal upload staging", () => {
  it("writes, verifies, exposes and then removes the exact temporary upload", () => {
    const root = mkdtempSync(join(tmpdir(), "traderlink-upload-staging-test-"));
    try {
      const sourceBytes = new TextEncoder().encode("Symbol,Side,Quantity\nABC,BUY,1\n");
      let stagedPath = "";
      const result = withStagedJournalUpload(sourceBytes, (sourcePath) => {
        stagedPath = sourcePath;
        expect([...readFileSync(sourcePath)]).toEqual([...sourceBytes]);
        return "verified" as const;
      }, {
        NODE_ENV: "test",
        TRADERLINK_PLATFORM_JOURNAL_UPLOAD_STAGING_ROOT: root,
      });
      expect(result).toBe("verified");
      expect(stagedPath).not.toBe("");
      expect(existsSync(stagedPath)).toBe(false);
    } finally {
      rmSync(root, { recursive: true, force: true });
    }
  });
});
