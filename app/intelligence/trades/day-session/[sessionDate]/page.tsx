import type { Metadata } from "next";
import TradesPage from "../../page";

export const metadata: Metadata = {
  title: "Day Session | Trader Intelligence",
};

export const dynamic = "force-dynamic";

export default async function DaySessionPage({
  params,
}: {
  params: Promise<{
    sessionDate: string;
  }>;
}) {
  const { sessionDate } = await params;

  return TradesPage({
    searchParams: Promise.resolve({
      session: decodeURIComponent(sessionDate),
      view: "session_stories",
    }),
  });
}
