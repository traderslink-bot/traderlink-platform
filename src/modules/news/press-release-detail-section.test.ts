// @vitest-environment jsdom
import {createElement} from "react";
import {renderToStaticMarkup} from "react-dom/server";
import {describe,expect,it} from "vitest";
import {normalizePressReleaseDetailText,PressReleaseDetailSection} from "@/app/(dashboard)/press-releases/press-release-detail-section";

describe("press release detail formatting",()=>{
  it("removes Discord emphasis markers without changing the level text",()=>{
    expect(normalizePressReleaseDetailText("**Resistance:** 11.49")).toBe("Resistance: 11.49");
    expect(normalizePressReleaseDetailText("_Data generated during REGULAR session_ ")).toBe("Data generated during REGULAR session");
  });
  it("renders generated-data text as a disclaimer outside the bullet list",()=>{
    const html=renderToStaticMarkup(createElement(PressReleaseDetailSection,{title:"Support and resistance",items:["**$AGLT**","**Resistance:** 11.49","**Support:** 8.40","_Data generated during REGULAR session at $10.8800_"]}));
    expect(html).not.toMatch(/\*\*|_Data/u);
    expect(html).toContain("$AGLT");
    expect(html).toContain("data-generated-disclaimer");
    expect((html.match(/<li/g)??[])).toHaveLength(3);
  });
});
