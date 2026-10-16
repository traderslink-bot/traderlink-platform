export type MembershipCalendarViews = Readonly<{ month: boolean; week: boolean }>;

export function preferredMembershipCalendarView(views: MembershipCalendarViews, requested: unknown): "month" | "week" {
  if (requested === "month" || requested === "week") return requested;
  return !views.month && views.week ? "week" : "month";
}
