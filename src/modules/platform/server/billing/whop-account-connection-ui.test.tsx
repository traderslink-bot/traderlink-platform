// @vitest-environment jsdom
import { act } from "react";
import { createRoot,type Root } from "react-dom/client";
import { afterEach,beforeEach,expect,it } from "vitest";
import { ThemeProvider } from "@mui/material/styles";
import { createTraderMaterialTheme } from "@/app/mui-theme";
import { WhopAccountConnection } from "@/app/(member)/account/membership/whop-account-connection";

let container:HTMLDivElement,root:Root;
beforeEach(()=>{
  (globalThis as typeof globalThis & {IS_REACT_ACT_ENVIRONMENT:boolean}).IS_REACT_ACT_ENVIRONMENT=true;
  container=document.createElement("div");document.body.append(container);root=createRoot(container);
});
afterEach(()=>{act(()=>root.unmount());container.remove();});
function render(state:"linked"|"not_linked"|"conflict"|"unavailable",canConnect:boolean,notice:"connected"|"invalid-state"|null=null,appearance:"light"|"dark"="light"){
  act(()=>root.render(<ThemeProvider theme={createTraderMaterialTheme(appearance)}><WhopAccountConnection state={state} canConnect={canConnect} notice={notice}/></ThemeProvider>));
}
it.each(["light","dark"] as const)("offers a visible same-origin button in %s with pending and browser-return behavior",appearance=>{
  render("not_linked",true,null,appearance);
  const link=container.querySelector("a")!;expect(link.getAttribute("href")).toBe("/api/billing/whop/connect?entry=billing");
  link.focus();expect(document.activeElement).toBe(link);
  const stop=(event:Event)=>event.preventDefault();document.addEventListener("click",stop);
  act(()=>link.dispatchEvent(new MouseEvent("click",{bubbles:true,cancelable:true,button:0})));
  expect(container.textContent).toContain("Opening Whop");expect(container.querySelector("a")?.getAttribute("aria-disabled")).toBe("true");
  act(()=>window.dispatchEvent(new Event("pageshow")));expect(container.textContent).toContain("Connect Whop");
  document.removeEventListener("click",stop);
});
it("does not offer an unavailable action or invent a connection from callback query text",()=>{
  render("not_linked",false,"connected");expect(container.querySelector("a")).toBeNull();expect(container.textContent).toContain("Not connected");
});
it("shows real linked identity without a purchase, disconnect or account-change action",()=>{
  render("linked",true,"connected");expect(container.textContent).toContain("Connected");expect(container.querySelector("a")).toBeNull();
  expect(container.textContent).not.toContain("Premium active");
});
it("keeps errors and conflict review beside the affected account row",()=>{
  render("not_linked",true,"invalid-state");expect(container.querySelector('[role="alert"]')?.textContent).toContain("couldn’t connect");
  render("conflict",false);expect(container.textContent).toContain("needs support review");expect(container.querySelector("a")).toBeNull();
});
