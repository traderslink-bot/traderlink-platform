import { withJournalAdminPageDatabase } from "@/src/modules/platform/server/administration/require-journal-admin-page";
import { SwingPlanStore } from "@/src/modules/swings/server/swing-plan-store";
import { JournalAdminPage } from "../journal-admin-ui";
import { SwingPlanEditor } from "./swing-plan-editor";
import { SWING_PLAN_OWNER_HELP } from "@/src/modules/help/swing-plan-owner-guide";
export const dynamic="force-dynamic";
export const metadata={title:"Swing Trade Plans | Journal Administration"};
export default async function SwingPlansPage(){
  const plans=await withJournalAdminPageDatabase(db=>new SwingPlanStore(db).list());
  return <JournalAdminPage><SwingPlanEditor initialPlans={plans}/><details style={{marginTop:24}}><summary>Help with Swing Trade Plans</summary>{SWING_PLAN_OWNER_HELP.map(section=><section key={section.title}><h3>{section.title}</h3><p>{section.text}</p></section>)}</details></JournalAdminPage>;
}
