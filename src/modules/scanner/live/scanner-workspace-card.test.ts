// @vitest-environment jsdom
import { act, createElement } from "react";
import { createRoot } from "react-dom/client";
import { expect, it } from "vitest";

import { ScannerWorkspaceCard } from "@/app/(dashboard)/screeners/scanner-workspace-card";

it("applies one compact content-padding contract to every workspace card",async()=>{
  const container=document.createElement("div");document.body.append(container);const root=createRoot(container);
  await act(async()=>root.render(createElement(ScannerWorkspaceCard,{slot:"slot-5",widget:"market-events"} as Parameters<typeof ScannerWorkspaceCard>[0],createElement("section",{"data-traderlink-platform-dashboard-card":"panel"},createElement("div",{className:"MuiCardContent-root"},"Events")))));
  const card=container.querySelector('[data-scanner-workspace-card="market-events"]')!;
  const content=card.querySelector(".MuiCardContent-root")!;
  expect(card.getAttribute("data-scanner-workspace-slot")).toBe("slot-5");
  expect(getComputedStyle(content).padding).toBe("10px");
  await act(async()=>root.unmount());container.remove();
});
