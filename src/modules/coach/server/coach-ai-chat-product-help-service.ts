import { HELP_SEARCH_RECORDS } from "@/src/modules/help/help-content-registry";

const MAX_QUERY_LENGTH = 160;

function terms(value: string): readonly string[] {
  return Object.freeze(value.toLocaleLowerCase("en-US")
    .normalize("NFKC")
    .split(/[^a-z0-9]+/u)
    .filter((term) => term.length > 1));
}

export class CoachAiChatProductHelpService {
  search(input: Readonly<{ query: string; limit: number }>) {
    const query = input.query.trim();
    if (query.length === 0 || query.length > MAX_QUERY_LENGTH ||
        !Number.isSafeInteger(input.limit) || input.limit < 1 || input.limit > 8) {
      throw new Error("TRADERLINK_COACH_FACTUAL_TOOL_INVALID");
    }
    const queryTerms = terms(query);
    return Object.freeze(HELP_SEARCH_RECORDS
      .map((record) => {
        const title = record.title.toLocaleLowerCase("en-US");
        const body = `${record.title} ${record.summary} ${record.section} ${record.keywords.join(" ")}`
          .toLocaleLowerCase("en-US");
        const score = queryTerms.reduce((total, term) => total +
          (title.includes(term) ? 4 : 0) +
          (body.includes(term) ? 1 : 0), 0);
        return Object.freeze({ record, score });
      })
      .filter((item) => item.score > 0)
      .sort((left, right) => right.score - left.score ||
        left.record.title.localeCompare(right.record.title))
      .slice(0, input.limit)
      .map(({ record }) => Object.freeze({
        title: record.title,
        summary: record.summary,
        section: record.section,
        href: record.href,
      })));
  }
}
