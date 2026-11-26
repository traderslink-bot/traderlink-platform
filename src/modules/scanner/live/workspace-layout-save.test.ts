// @vitest-environment jsdom

import { act, createElement, useState } from "react";
import { createRoot } from "react-dom/client";
import { ThemeProvider } from "@mui/material/styles";
import { expect, it, vi } from "vitest";

import { createTraderMaterialTheme } from "@/app/mui-theme";
import { ScannerLayoutToolbar } from "@/app/(dashboard)/screeners/workspace/scanner-layout-editor";
import { widgets } from "@/app/(dashboard)/screeners/workspace/scanner-desktop-layout";

it("offers a name-only prompt without losing edits to the default layout", async () => {
  const previous = Reflect.get(globalThis, "IS_REACT_ACT_ENVIRONMENT");
  Reflect.set(globalThis, "IS_REACT_ACT_ENVIRONMENT", true);
  const container=document.createElement("div");
  document.body.append(container);
  const root=createRoot(container);
  const saved=vi.fn();

  function Editor() {
    const [editing,setEditing]=useState(false);
    const [name,setName]=useState("");
    const [visible,setVisible]=useState(widgets);
    return createElement(ScannerLayoutToolbar,{
      addCard:{available:false,onOpen:()=>{},onAdd:()=>{}},
      editing,name,active:"",setName,saved:[],visible,message:"",canUndo:false,
      onEdit:()=>setEditing(true),
      onToggle:widget=>setVisible(current=>current.filter(item=>item!==widget)),
      onSave:()=>{saved(name,visible);setEditing(false);},
      onCancel:()=>setEditing(false),onSelect:()=>{},onReset:()=>{},onPreset:()=>{},onUndo:()=>{},
    });
  }
  const action=(label:string,scope:ParentNode=document)=>[...scope.querySelectorAll<HTMLButtonElement>("button")].find(
    button=>(button.getAttribute("aria-label")??button.textContent)===label,
  )!;
  const click=(element:HTMLElement)=>act(async()=>{element.click();});
  const settings=()=>document.querySelector('[role="region"][aria-label="Layout settings"]');
  const prompt=()=>document.querySelector('[role="dialog"]');
  const typeName=(input:HTMLInputElement,name:string)=>act(async()=>{
    Object.getOwnPropertyDescriptor(HTMLInputElement.prototype,"value")!.set!.call(input,name);
    input.dispatchEvent(new Event("input",{bubbles:true}));
  });
  try {
    await act(async()=>{
      root.render(createElement(ThemeProvider,{theme:createTraderMaterialTheme("dark")},createElement(Editor)));
    });
    await click(action("Edit layout"));
    const breakoutLabel=[...settings()!.querySelectorAll("label")].find(label=>label.textContent==="Breakouts");
    const checkbox=breakoutLabel?.querySelector<HTMLInputElement>('input[type="checkbox"]');
    expect(checkbox?.checked).toBe(true);
    await click(checkbox!);
    await click(action("Close layout settings"));
    expect(settings()).toBeNull();

    expect(action("Save").disabled).toBe(false);
    await click(action("Save"));
    expect(settings()).toBeNull();
    expect(prompt()?.textContent).toContain("Name this layout");
    expect(prompt()?.querySelectorAll("input")).toHaveLength(1);
    const input=prompt()!.querySelector("label")!.control as HTMLInputElement;
    expect(document.activeElement).toBe(input);
    expect(action("Save",prompt()!).disabled).toBe(true);
    await typeName(input,"  ");
    expect(action("Save",prompt()!).disabled).toBe(true);
    await typeName(input,"Discard this name");
    await click(action("Cancel",prompt()!));
    expect(saved).not.toHaveBeenCalled();

    await click(action("Layout settings"));
    expect(settings()).not.toBeNull();
    await click(action("Save"));
    expect(settings()).toBeNull();
    const reopenedInput=prompt()!.querySelector("input")!;
    expect(reopenedInput.value).toBe("");
    await typeName(reopenedInput,"My scanner layout");
    await click(action("Save",prompt()!));
    expect(saved).toHaveBeenCalledOnce();
    expect(saved).toHaveBeenCalledWith("My scanner layout",widgets.filter(widget=>widget!=="breakouts"));
  } finally {
    await act(async()=>{root.unmount();});
    container.remove();
    Reflect.set(globalThis, "IS_REACT_ACT_ENVIRONMENT", previous);
  }
});
