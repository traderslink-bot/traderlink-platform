/** Keep every character; prefer paragraph/line/word boundaries, then graphemes. */
export function splitDiscordAlertBody(body: string, capacity: number): readonly string[] {
  if (!Number.isSafeInteger(capacity) || capacity < 16) throw new Error("Invalid alert part capacity.");
  const result: string[] = [];
  let remaining = body;
  const segmenter = new Intl.Segmenter(undefined, { granularity: "grapheme" });
  while (remaining.length > capacity) {
    let boundary = capacity;
    for (const delimiter of ["\n\n", "\n", " "]) {
      const found = remaining.lastIndexOf(delimiter, capacity - delimiter.length);
      if (found >= capacity / 2) { boundary = found + delimiter.length; break; }
    }
    let safe = 0;
    for (const segment of segmenter.segment(remaining)) {
      const end = segment.index + segment.segment.length;
      if (end > boundary) break;
      safe = end;
    }
    // One pathological grapheme can exceed an entire Discord message. Preserve
    // code points rather than dropping it or creating an invalid surrogate pair.
    if (!safe) {
      for (const point of remaining) { if (safe + point.length > boundary) break; safe += point.length; }
    }
    if (!safe) throw new Error("Alert part cannot be represented.");
    result.push(remaining.slice(0, safe)); remaining = remaining.slice(safe);
  }
  result.push(remaining);
  return result;
}


export function partitionDiscordAlertText(input: Readonly<{ single:string; body:string; header:(part:number,total:number)=>string; footer:string }>): readonly string[] {
  if(input.single.length<=2000)return [input.single];
  let total=2;
  for(let attempt=0;attempt<8;attempt++){
    const chunks=splitDiscordAlertBody(input.body,2000-input.header(total,total).length-input.footer.length);
    if(chunks.length>32)throw new Error("Alert requires too many message parts.");
    if(chunks.length===total)return chunks.map((chunk,index)=>`${input.header(index+1,total)}${chunk}${input.footer}`);
    total=chunks.length;
  }
  throw new Error("Alert part numbering did not converge.");
}
