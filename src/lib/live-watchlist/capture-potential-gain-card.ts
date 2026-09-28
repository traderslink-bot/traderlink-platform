/** Capture the actual, fully rendered owner preview. No server browser or AI. */
export async function capturePotentialGainCard(element: HTMLElement): Promise<Blob> {
  await document.fonts.ready;
  const width = Math.ceil(element.getBoundingClientRect().width);
  const height = Math.ceil(element.getBoundingClientRect().height);
  if (!width || !height || width > 1600 || height > 2400) throw Error("The card could not be captured. Reopen the preview.");
  const clone = element.cloneNode(true) as HTMLElement;
  const originals = [element, ...Array.from(element.querySelectorAll<HTMLElement>("*"))];
  const copies = [clone, ...Array.from(clone.querySelectorAll<HTMLElement>("*"))];
  const usedFamilies = new Set<string>();
  originals.forEach((node, index) => {
    const style = getComputedStyle(node);
    for (const family of style.fontFamily.split(",")) usedFamilies.add(family.trim().replace(/["']/g, ""));
    const target = copies[index];
    for (const name of Array.from(style)) target.style.setProperty(name, style.getPropertyValue(name));
    target.style.setProperty("animation", "none"); target.style.setProperty("transition", "none");
    target.removeAttribute("id");
  });
  clone.style.margin = "0"; clone.style.position = "static"; clone.style.transform = "none";
  // Inline same-origin bundled fonts so the PNG uses the same typeface.
  const fontRules: string[] = [];
  const collect = (rules: CSSRuleList) => {
    for (const rule of Array.from(rules)) {
      if (rule.type === CSSRule.FONT_FACE_RULE && usedFamilies.has((rule as CSSFontFaceRule).style.fontFamily.replace(/["']/g, ""))) fontRules.push(rule.cssText);
      else if ("cssRules" in rule) collect((rule as CSSGroupingRule).cssRules);
    }
  };
  for (const sheet of Array.from(document.styleSheets)) { try { collect(sheet.cssRules); } catch { /* Cross-origin fonts cannot be read. */ } }
  let fonts = fontRules.join("\n");
  const urls = [...new Set(Array.from(fonts.matchAll(/url\(["']?([^"')]+)["']?\)/g), match => match[1]))];
  for (const raw of urls.slice(0, 24)) {
    const url = new URL(raw, location.href);
    if (url.origin !== location.origin || !url.pathname.startsWith("/_next/static/")) continue;
    const response = await fetch(url, { signal: AbortSignal.timeout(8000) });
    if (!response.ok) throw Error("The card font could not be loaded. Try preview again.");
    const blob = await response.blob();
    if (blob.size > 1024 * 1024) throw Error("The card font is too large.");
    const data = await new Promise<string>((resolve, reject) => { const reader = new FileReader(); reader.onload = () => resolve(String(reader.result)); reader.onerror = reject; reader.readAsDataURL(blob); });
    fonts = fonts.split(raw).join(data);
  }
  const style = document.createElement("style"); style.textContent = fonts; clone.prepend(style);
  clone.setAttribute("xmlns", "http://www.w3.org/1999/xhtml");
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}"><foreignObject width="100%" height="100%">${new XMLSerializer().serializeToString(clone)}</foreignObject></svg>`;
  // Data URL avoids SVG blob-origin canvas tainting in browser image decoders.
  const image = new Image(); image.src = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
  await image.decode();
  const canvas = document.createElement("canvas"); canvas.width = width * 2; canvas.height = height * 2;
  const context = canvas.getContext("2d"); if (!context) throw Error("Image preview is unavailable in this browser.");
  context.scale(2, 2); context.drawImage(image, 0, 0);
  return new Promise((resolve, reject) => canvas.toBlob(blob => blob ? resolve(blob) : reject(Error("Image capture failed.")), "image/png"));
}
