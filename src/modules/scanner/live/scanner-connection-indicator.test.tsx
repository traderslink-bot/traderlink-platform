import { act } from "react";
import { createRoot } from "react-dom/client";
import { expect, it, vi } from "vitest";
import { ScannerConnectionIndicator } from "@/app/(dashboard)/screeners/scanner-connection-indicator";

it("makes the visible recovery icon a named retry button and hides it when healthy", async () => {
  const host = document.createElement("div"), root = createRoot(host), retry = vi.fn(); document.body.append(host);
  try {
    await act(async () => root.render(<ScannerConnectionIndicator phase="reconnecting" onRetry={retry} />));
    const button = host.querySelector("button")!;
    expect(button.getAttribute("aria-label")).toContain("Retry connection");
    await act(async () => button.click()); expect(retry).toHaveBeenCalledOnce();
    await act(async () => root.render(<ScannerConnectionIndicator phase={null} onRetry={retry} />));
    expect(host.querySelector("button")).toBeNull();
  } finally { await act(async () => root.unmount()); host.remove(); }
});
