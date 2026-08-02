import { redirect } from "next/navigation";

export default function LegacyPlatformReadinessRedirect() {
  redirect("/workspace/readiness");
}
