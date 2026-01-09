import type { DecisionResponse } from "./schemas.js";

const HARD_ADVICE = [
  [/你应该/g, "你可以考虑"],
  [/你必须/g, "你不妨先想想是否需要"],
  [/最佳选择/g, "一个可能的选择"],
  [/最好的办法/g, "一种可行的办法"],
] as const;

export function softenLanguage(resp: DecisionResponse): DecisionResponse {
  const fix = (s: string): string => {
    let result = s;
    for (const pair of HARD_ADVICE) {
      const re = pair[0] as RegExp;
      const rep = pair[1] as string;
      result = result.replace(re, rep);
    }
    return result;
  };

  return {
    cards: resp.cards.map((c) => ({
      ...c,
      title: fix(c.title),
      content: c.content ? fix(c.content) : c.content,
      items: c.items ? c.items.map(fix) : c.items,
    })),
  };
}