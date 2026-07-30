import { redirect } from "next/navigation";

export default async function LegacyDaySessionCompatibilityPage({
  params,
}: {
  params: Promise<{
    sessionDate: string;
  }>;
}) {
  const { sessionDate } = await params;

  redirect(`/trade-tracker/${encodeURIComponent(sessionDate)}`);
}
