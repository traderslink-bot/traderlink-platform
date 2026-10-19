import assert from "node:assert/strict";
import { renderToStaticMarkup } from "react-dom/server";
import { UnifiedPlanList } from "../../app/admin/journal/memberships/unified-plan-list";
import { UnifiedPlanEditor } from "../../app/admin/journal/memberships/unified-plan-editor";
import { emptyMembershipPlan, newMembershipPlanPrice } from "../modules/platform/contracts/membership-plan-editor";

const noMutation = async () => { throw new Error("Rendering must not mutate or call a provider"); };
const props = { items: [], features: [], providers: [], pages: [], open: noMutation, discard: noMutation,
  save: noMutation, archive: noMutation, refresh: () => { throw new Error("Rendering must not refresh"); } };
const empty = renderToStaticMarkup(<UnifiedPlanList {...props} />);
assert.ok(empty.includes("No plans yet."));
assert.ok(!empty.includes("Plan name"));
const creating = renderToStaticMarkup(<UnifiedPlanList {...props} createNew />);
assert.ok(creating.includes("Plan name"));
assert.ok(creating.includes("Save draft and close"));
assert.ok(creating.includes("Save and publish"));
const plan = emptyMembershipPlan();
plan.name = "QA premium";
plan.features = [{ key: "levels.generations", limit: 25, resetDays: 7, period: null, brief: "Editable brief", details: "Editable details" }];
plan.prices = [{ ...newMembershipPlanPrice("local-render-only"), name: "Standard access" }];
const editing = renderToStaticMarkup(<UnifiedPlanEditor initial={plan} draftId={null} revision={null} providers={[]} pages={[]}
  features={[{ key: "levels.generations", label: "Levels Generator", kind: "limit", module: "levels", enforcement: "enforced", brief: "Default", details: "Default details" }]}
  memberCount={0} save={noMutation} close={() => { throw new Error("Rendering must not close"); }} />);
for (const value of ["QA premium", "Editable brief", "Editable details", "Standard access", 'value="25"', 'value="7"']) assert.ok(editing.includes(value), value);
console.log(JSON.stringify({ ok: true, boundary: "server-rendered UI only, not browser interaction", emptyState: true, newPlanWithoutRow: true, populatedEditor: true }));
