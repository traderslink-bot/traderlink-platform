import { describe, expect, it } from "vitest";
import { coachingReviewReadiness, coachingReviewReadinessMessage } from "./coaching-review-readiness";

const summary = { coachFeedback: "Overall summary", wentWell: "", needsWork: "", nextFocus: "", previousFocusAssessment: "", focusFeedback: {} };

describe("agreed Coaching review work", () => {
  it.each([
    { required: 0, states: [], saved: 0, total: 0, ready: true },
    { required: null, states: [], saved: 0, total: 0, ready: true },
    { required: 1, states: [], saved: 0, total: 1, ready: false },
    { required: 2, states: ["saved"], saved: 1, total: 2, ready: false },
    { required: 2, states: ["saved", "queued"], saved: 1, total: 2, ready: false },
    { required: 2, states: ["saved", "saved"], saved: 2, total: 2, ready: true },
    { required: 1, states: ["saved", "queued"], saved: 1, total: 2, ready: false },
    { required: 1, states: ["saved", "removed"], saved: 1, total: 1, ready: true },
    { required: 1, states: ["removed"], saved: 0, total: 1, ready: false },
  ])("$required required, $states selected => $saved / $total, ready $ready", ({ required, states, saved, total, ready }) => {
    expect(coachingReviewReadiness({ ...summary, agreedTradeCount: required }, states.map(workflowState => ({ workflowState })), []))
      .toMatchObject({ saved, total, ready });
  });

  it("does not send empty reviews or count cancelled actions as content", () => {
    const empty = { ...summary, coachFeedback: "   ", agreedTradeCount: 0 };
    expect(coachingReviewReadiness(empty, [], [{ status: "cancelled" }]).ready).toBe(false);
    expect(coachingReviewReadiness(empty, [], [{ status: "open" }]).ready).toBe(true);
    expect(coachingReviewReadiness({ ...empty, acceptanceState: "pending" }, [], [{ status: "open" }]).ready).toBe(false);
  });

  it("explains missing work without treating a summary as a substitute or granting access", () => {
    const progress = coachingReviewReadiness({ ...summary, agreedTradeCount: 1 }, [], []);
    expect(coachingReviewReadinessMessage(progress, false)).toContain("1 trade review; 0 saved");
    expect(coachingReviewReadinessMessage(progress, false)).toContain("Only the student can grant Journal access");
    expect(coachingReviewReadinessMessage(progress, true)).toContain("Select and save");
    expect(coachingReviewReadinessMessage(progress, true)).not.toContain("Journal access is off");
    expect(coachingReviewReadinessMessage(coachingReviewReadiness({ ...summary, agreedTradeCount: 0 }, [], []), false)).toBeNull();
  });
});
