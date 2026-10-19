"use client";

import { useRouter } from "next/navigation";
import type { MembershipPlanListItem, MembershipPlanFeatureChoice, MembershipPlanProvider } from "@/src/modules/platform/contracts/membership-plan-editor";
import { UnifiedPlanList } from "./unified-plan-list";
import { openUnifiedPlanAction, discardUnifiedPlanDraftAction, saveUnifiedPlanAction, archiveUnifiedPlanAction, deleteUnifiedPlanAction, refreshUnifiedPlanBaselineAction } from "./unified-plan-draft-actions";

export function UnifiedPlanWorkspace(props: {
  items: readonly MembershipPlanListItem[];
  features: readonly MembershipPlanFeatureChoice[];
  providers: readonly MembershipPlanProvider[];
  pages: readonly { id: string; name: string }[];
  createNew?: boolean;
}) {
  const router = useRouter();
  return <UnifiedPlanList {...props} open={openUnifiedPlanAction} discard={discardUnifiedPlanDraftAction}
    save={saveUnifiedPlanAction} archive={archiveUnifiedPlanAction} remove={deleteUnifiedPlanAction} refreshBaseline={refreshUnifiedPlanBaselineAction} refresh={() => router.refresh()} />;
}
