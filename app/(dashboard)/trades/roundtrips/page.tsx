import type { Metadata } from "next";
import { redirect } from "next/navigation";

export const metadata: Metadata = {
  title: "Round Trips | TraderLink Platform",
};

export default function RoundTripsPage() {
  redirect("/analytics/execution");
}
