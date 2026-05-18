import type { ReactNode } from "react";

import {
  getAcademyLesson,
  isAcademyLessonLaunchReady,
} from "@/src/lib/academy/academy-content";

type MarkdownBlock =
  | { type: "heading"; level: 1 | 2 | 3 | 4; text: string; key: string }
  | { type: "paragraph"; text: string; key: string }
  | { type: "quote"; text: string; key: string }
  | { type: "image"; alt: string; src: string; key: string }
  | { type: "list"; items: MarkdownListItem[]; key: string }
  | { type: "cardGrid"; groups: MarkdownCardGroup[]; key: string }
  | { type: "table"; rows: string[][]; key: string }
  | { type: "code"; code: string; key: string }
  | { type: "rule"; key: string };

type MarkdownListItem = {
  text: string;
  ordered: boolean;
  depth: number;
};

type MarkdownCardGroup = {
  title: string;
  links: Array<{
    text: string;
    href: string;
  }>;
};

export function AcademyMarkdown({ body }: { body: string }) {
  const blocks = parseMarkdownBlocks(body);

  return (
    <div className="space-y-6">
      {blocks.map((block) => renderBlock(block))}
    </div>
  );
}

function renderBlock(block: MarkdownBlock) {
  if (block.type === "heading") {
    if (block.level === 1) {
      return (
        <h1
          key={block.key}
          className="text-4xl font-semibold tracking-normal text-white sm:text-5xl"
        >
          {renderInline(block.text)}
        </h1>
      );
    }

    if (block.level === 2) {
      return (
        <h2
          key={block.key}
          className="border-t border-white/10 pt-8 text-2xl font-semibold tracking-normal text-white"
        >
          {renderInline(block.text)}
        </h2>
      );
    }

    return (
      <h3
        key={block.key}
        className="text-xl font-semibold tracking-normal text-cyan-100"
      >
        {renderInline(block.text)}
      </h3>
    );
  }

  if (block.type === "paragraph") {
    return (
      <p key={block.key} className="text-base leading-8 text-slate-200">
        {renderInline(block.text)}
      </p>
    );
  }

  if (block.type === "quote") {
    return (
      <blockquote
        key={block.key}
        className="border-l-2 border-cyan-300 bg-cyan-400/10 px-5 py-4 text-base leading-7 text-cyan-50"
      >
        {renderInline(block.text)}
      </blockquote>
    );
  }

  if (block.type === "image") {
    return (
      <figure key={block.key} className="overflow-hidden rounded-lg border border-cyan-200/20 bg-slate-950/80">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={block.src} alt={block.alt} className="h-auto w-full" />
        {block.alt ? (
          <figcaption className="border-t border-white/10 px-4 py-3 text-sm text-slate-400">
            {block.alt}
          </figcaption>
        ) : null}
      </figure>
    );
  }

  if (block.type === "list") {
    return (
      <ul
        key={block.key}
        className="space-y-3 pl-6 text-base leading-7 text-slate-200"
      >
        {block.items.map((item, index) => (
          <li
            key={`${block.key}-${index}`}
            className={item.ordered ? "list-decimal" : "list-disc"}
            style={{ marginLeft: `${item.depth * 1.25}rem` }}
          >
            {renderInline(item.text)}
          </li>
        ))}
      </ul>
    );
  }

  if (block.type === "cardGrid") {
    return (
      <div
        key={block.key}
        className="grid grid-cols-[repeat(auto-fit,minmax(10rem,1fr))] gap-4"
      >
        {block.groups.map((group) => (
          <section
            key={`${block.key}-${group.title}`}
            className="rounded-lg border border-cyan-200/20 bg-cyan-400/10 p-4"
          >
            <h3 className="text-base font-semibold tracking-normal text-cyan-100">
              {group.title}
            </h3>
            <div className="mt-4 space-y-2">
              {group.links.map((link) => {
                const unavailable = isUnavailableAcademyHref(link.href);

                return unavailable ? (
                  <span
                    key={link.href}
                    className="block rounded border border-white/10 bg-white/5 px-3 py-2 text-sm font-medium text-slate-300"
                  >
                    {link.text}
                  </span>
                ) : (
                  <a
                    key={link.href}
                    href={link.href}
                    className="block rounded border border-white/10 bg-slate-950/45 px-3 py-2 text-sm font-medium text-slate-100 transition hover:border-cyan-200/40 hover:bg-cyan-300/10"
                  >
                    {link.text}
                  </a>
                );
              })}
            </div>
          </section>
        ))}
      </div>
    );
  }

  if (block.type === "table") {
    const [header, ...rows] = block.rows;

    return (
      <div
        key={block.key}
        className="overflow-x-auto rounded-lg border border-white/10"
      >
        <table className="min-w-[42rem] divide-y divide-white/10 text-left text-sm sm:min-w-full">
          <thead className="bg-white/5 text-slate-200">
            <tr>
              {header.map((cell, index) => (
                <th
                  key={`${block.key}-h-${index}`}
                  className="max-w-[18rem] px-4 py-3 font-semibold"
                >
                  {renderInline(cell)}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-white/10 text-slate-300">
            {rows.map((row, rowIndex) => (
              <tr key={`${block.key}-r-${rowIndex}`}>
                {row.map((cell, cellIndex) => (
                  <td
                    key={`${block.key}-c-${rowIndex}-${cellIndex}`}
                    className="max-w-[18rem] px-4 py-3 align-top leading-6"
                  >
                    {renderInline(cell)}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  }

  if (block.type === "rule") {
    return <hr key={block.key} className="border-white/10" />;
  }

  return (
    <pre
      key={block.key}
      className="overflow-x-auto rounded-lg border border-white/10 bg-slate-950 p-4 text-sm leading-6 text-slate-200"
    >
      <code>{block.code}</code>
    </pre>
  );
}

function parseMarkdownBlocks(body: string): MarkdownBlock[] {
  const lines = body.replace(/\r\n/g, "\n").split("\n");
  const blocks: MarkdownBlock[] = [];
  let index = 0;

  while (index < lines.length) {
    const line = lines[index];
    const trimmed = line.trim();

    if (!trimmed) {
      index += 1;
      continue;
    }

    if (/^---+$/.test(trimmed)) {
      blocks.push({ type: "rule", key: `rule-${index}` });
      index += 1;
      continue;
    }

    if (trimmed === ":::lesson-card-grid") {
      const gridLines: string[] = [];
      index += 1;

      while (index < lines.length && lines[index].trim() !== ":::") {
        gridLines.push(lines[index]);
        index += 1;
      }

      blocks.push({
        type: "cardGrid",
        groups: parseCardGrid(gridLines),
        key: `card-grid-${index}`,
      });
      index += 1;
      continue;
    }

    if (trimmed.startsWith("```")) {
      const codeLines: string[] = [];
      index += 1;

      while (index < lines.length && !lines[index].trim().startsWith("```")) {
        codeLines.push(lines[index]);
        index += 1;
      }

      blocks.push({
        type: "code",
        code: codeLines.join("\n"),
        key: `code-${index}`,
      });
      index += 1;
      continue;
    }

    const heading = trimmed.match(/^(#{1,4})\s+(.+)$/);

    if (heading) {
      blocks.push({
        type: "heading",
        level: Math.min(heading[1].length, 4) as 1 | 2 | 3 | 4,
        text: heading[2],
        key: `heading-${index}`,
      });
      index += 1;
      continue;
    }

    const image = trimmed.match(/^!\[([^\]]*)\]\(([^)]+)\)$/);

    if (image) {
      blocks.push({
        type: "image",
        alt: image[1],
        src: image[2],
        key: `image-${index}`,
      });
      index += 1;
      continue;
    }

    if (isTableStart(lines, index)) {
      const rows: string[][] = [];

      while (index < lines.length && lines[index].trim().includes("|")) {
        const row = parseTableRow(lines[index]);

        if (!isSeparatorRow(row)) {
          rows.push(row);
        }

        index += 1;
      }

      blocks.push({ type: "table", rows, key: `table-${index}` });
      continue;
    }

    const unordered = line.match(/^(\s*)[-*]\s+(.+)$/);
    const ordered = line.match(/^(\s*)\d+\.\s+(.+)$/);

    if (unordered || ordered) {
      const items: MarkdownListItem[] = [];

      while (index < lines.length) {
        const unorderedItem = lines[index].match(/^(\s*)[-*]\s+(.+)$/);
        const orderedItem = lines[index].match(/^(\s*)\d+\.\s+(.+)$/);
        const itemMatch = unorderedItem ?? orderedItem;

        if (!itemMatch) {
          break;
        }

        items.push({
          text: itemMatch[2],
          ordered: Boolean(orderedItem),
          depth: Math.floor(itemMatch[1].length / 2),
        });
        index += 1;
      }

      blocks.push({
        type: "list",
        items,
        key: `list-${index}`,
      });
      continue;
    }

    if (trimmed.startsWith(">")) {
      const quoteLines: string[] = [];

      while (index < lines.length && lines[index].trim().startsWith(">")) {
        quoteLines.push(lines[index].trim().replace(/^>\s?/, ""));
        index += 1;
      }

      blocks.push({
        type: "quote",
        text: quoteLines.join(" "),
        key: `quote-${index}`,
      });
      continue;
    }

    const paragraphLines: string[] = [];

    while (index < lines.length && lines[index].trim()) {
      const current = lines[index].trim();

      if (
        current.startsWith("#") ||
        current.startsWith("```") ||
        current.startsWith("!") ||
        current.startsWith(">") ||
        current.match(/^[-*]\s+/) ||
        current.match(/^\d+\.\s+/) ||
        isTableStart(lines, index)
      ) {
        break;
      }

      paragraphLines.push(current);
      index += 1;
    }

    if (paragraphLines.length > 0) {
      blocks.push({
        type: "paragraph",
        text: paragraphLines.join(" "),
        key: `paragraph-${index}`,
      });
      continue;
    }

    index += 1;
  }

  return blocks;
}

function isTableStart(lines: string[], index: number): boolean {
  return (
    lines[index]?.trim().includes("|") &&
    lines[index + 1]?.trim().includes("|") &&
    /^\s*\|?\s*:?-{3,}:?\s*\|/.test(lines[index + 1])
  );
}

function parseTableRow(line: string): string[] {
  return line
    .trim()
    .replace(/^\|/, "")
    .replace(/\|$/, "")
    .split("|")
    .map((cell) => cell.trim());
}

function isSeparatorRow(row: string[]): boolean {
  return row.every((cell) => /^:?-{3,}:?$/.test(cell));
}

function parseCardGrid(lines: string[]): MarkdownCardGroup[] {
  const groups: MarkdownCardGroup[] = [];
  let currentGroup: MarkdownCardGroup | null = null;

  for (const line of lines) {
    const heading = line.trim().match(/^###\s+(.+)$/);

    if (heading) {
      currentGroup = { title: heading[1], links: [] };
      groups.push(currentGroup);
      continue;
    }

    const link = line.trim().match(/^[-*]\s+\[([^\]]+)\]\(([^)]+)\)$/);

    if (link && currentGroup) {
      currentGroup.links.push({
        text: link[1],
        href: link[2],
      });
    }
  }

  return groups;
}

function renderInline(text: string): ReactNode[] {
  const nodes: ReactNode[] = [];
  const tokenPattern = /(\*\*[^*]+\*\*|`[^`]+`|\[[^\]]+\]\([^)]+\))/g;
  let cursor = 0;
  let match: RegExpExecArray | null;

  while ((match = tokenPattern.exec(text)) !== null) {
    if (match.index > cursor) {
      nodes.push(text.slice(cursor, match.index));
    }

    const token = match[0];
    const key = `${match.index}-${token}`;

    if (token.startsWith("**")) {
      nodes.push(
        <strong key={key} className="font-semibold text-white">
          {token.slice(2, -2)}
        </strong>,
      );
    } else if (token.startsWith("`")) {
      nodes.push(
        <code key={key} className="rounded bg-white/10 px-1.5 py-0.5 text-sm text-cyan-100">
          {token.slice(1, -1)}
        </code>,
      );
    } else {
      const link = token.match(/^\[([^\]]+)\]\(([^)]+)\)$/);

      if (link) {
        if (isUnavailableAcademyHref(link[2])) {
          nodes.push(
            <span key={key} className="font-medium text-slate-100">
              {link[1]}
            </span>,
          );
        } else {
          nodes.push(
            <a
              key={key}
              href={link[2]}
              className="text-cyan-200 underline decoration-cyan-300/40 underline-offset-4"
            >
              {link[1]}
            </a>,
          );
        }
      }
    }

    cursor = match.index + token.length;
  }

  if (cursor < text.length) {
    nodes.push(text.slice(cursor));
  }

  return nodes;
}

function isUnavailableAcademyHref(href: string): boolean {
  if (!href.startsWith("/academy/")) {
    return false;
  }

  const lesson = getAcademyLesson(href);

  return !lesson || !isAcademyLessonLaunchReady(lesson);
}
