import type { Metadata } from "next";
import { ExecutionFeedbackDebugClient } from "./execution-feedback-debug-client";

export const metadata: Metadata = {
  title: "Execution Feedback Debug | Trader Intelligence",
};

export default function ExecutionFeedbackDebugPage() {
  return <ExecutionFeedbackDebugClient />;
}
