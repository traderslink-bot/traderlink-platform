import { redirect } from "next/navigation";
import { SWING_IDEA } from "@/src/modules/swings/swing-idea-catalog";

// One idea page, not a separate catalogue or navigation destination.
export default function SwingIdeasPage() {
  redirect(`/swings/${SWING_IDEA.slug}`);
}
