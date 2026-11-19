import type Database from "better-sqlite3";

/** The normal coaching announcement renderer, shared by regular and selected-job delivery. */
export function communityCoachingPlanDeliveryContent(database: Database.Database, input: Readonly<{
  communityId: string; planId: string; communitySlug: string; communityName: string; publicOrigin: string;
}>) {
  const plan = database.prepare(`SELECT p.name,p.description,p.price_label,c.coach_slug,c.display_name
    FROM traderlink_community_coaching_plans p JOIN traderlink_community_coach_profiles c ON c.coach_profile_id=p.coach_profile_id
    WHERE p.plan_id=? AND p.community_id=? AND p.status='active' AND c.status='active'`)
    .get(input.planId, input.communityId) as { name: string; description: string; price_label: string; coach_slug: string; display_name: string } | undefined;
  if (!plan) return null;
  const url = `${input.publicOrigin}/communities/${input.communitySlug}/coaches/${plan.coach_slug}`;
  const price = plan.price_label ? `\n${plan.price_label}` : "";
  return { content: `**${plan.name} with ${plan.display_name}**${price}\n${plan.description.slice(0,1400)}\n\nPayment and access are handled by ${input.communityName} in Discord.\nOpen coaching details: ${url}`, allowed_mentions: { parse: [] as readonly string[] } };
}
