import { redirect } from "next/navigation";

export default async function SwingPositionDetailPage({
  params,
}: {
  params: Promise<{ positionRef: string }>;
}) {
  const { positionRef } = await params;
  redirect(`/trade-tracker/swings#swing-${encodeURIComponent(positionRef)}`);
}
