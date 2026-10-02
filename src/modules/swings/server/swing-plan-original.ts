import 'server-only';
import { SWING_IDEA } from '../swing-idea-catalog';
import { newSwingPlan, type SwingBlock, type SwingText } from '../swing-plan-contract';
import { SWING_TITLE, SWING_SECTIONS } from './swing-idea-content';

/** Converts only the bundled original markup; never an HTML intake for submissions. */
export function originalSwingPlanDraft() {
  const document = newSwingPlan();
  document.ticker = SWING_TITLE;
  document.title = SWING_TITLE;
  document.teaser.headline = SWING_IDEA.teaser;
  document.company.visible = false;
  document.sections = SWING_SECTIONS.map((html, sectionIndex) => {
    const blocks: SwingBlock[] = [];
    let title = '', index = 0;
    for (const match of html.matchAll(/<(p|h2|h3)>([\s\S]*?)<\/\1>/g)) {
      const [, tag, body] = match;
      const runs: SwingText[] = [];
      const marks: {bold?:boolean;italic?:boolean;underline?:boolean} = {};
      for (const token of body.split(/(<[^>]+>)/g)) {
        if (!token) continue;
        if (token === '<strong>') marks.bold = true;
        else if (token === '</strong>') delete marks.bold;
        else if (token === '<em>') marks.italic = true;
        else if (token === '</em>') delete marks.italic;
        else if (token === '<u>') marks.underline = true;
        else if (token === '</u>') delete marks.underline;
        else if (/^<br\s*\/?>$/.test(token)) runs.push({text:'\n',...marks});
        else if (token.startsWith('<')) throw Error('Original swing markup needs an explicit conversion.');
        else runs.push({text:token,...marks});
      }
      if (!blocks.length && !title && tag !== 'p') title = runs.map(run=>run.text).join('');
      else blocks.push({id:`original-${sectionIndex}-${index++}`,kind:tag==='p'?'paragraph':'heading',runs});
    }
    return {id:`original-section-${sectionIndex}`,title,visible:true,blocks};
  });
  return document;
}
