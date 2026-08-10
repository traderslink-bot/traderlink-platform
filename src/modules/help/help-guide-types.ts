export type HelpArticleBlock =
  | Readonly<{ kind: "paragraph"; text: string }>
  | Readonly<{ kind: "bullets"; items: readonly string[] }>
  | Readonly<{ kind: "steps"; items: readonly Readonly<{ title: string; text: string }>[] }>
  | Readonly<{ kind: "callout"; title: string; text: string; tone?: "info" | "warning" }>
  | Readonly<{ kind: "link"; href: string; label: string; text: string }>
  | Readonly<{
      kind: "table";
      columns: readonly string[];
      rows: readonly (readonly string[])[];
    }>;

export type HelpArticleSection = Readonly<{
  blocks: readonly HelpArticleBlock[];
  id: string;
  keywords: readonly string[];
  summary: string;
  title: string;
}>;
export type HelpGuide = Readonly<{
  description: string;
  sections: readonly HelpArticleSection[];
  slug: string;
  title: string;
}>;
