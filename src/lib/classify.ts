import {
  findDirectKeywordMatches,
  findFuzzyKeywordMatches,
} from "@/lib/ocrFuzzyMatch";
import type { HalalCheckResult, KeywordLists } from "@/lib/types";

type ClassifyOptions = {
  fuzzy?: boolean;
};

export function classifyInput(
  input: string,
  keywordLists: KeywordLists,
  options: ClassifyOptions = {},
): HalalCheckResult {
  const normalized = input.trim().toLowerCase();
  if (!normalized) {
    return {
      status: "unknown",
      reasons: ["Please provide a food or product name first."],
      source: "unknown",
    };
  }

  const foundHaram = options.fuzzy
    ? [
        ...new Set([
          ...findDirectKeywordMatches(input, keywordLists.haram),
          ...findFuzzyKeywordMatches(input, keywordLists.haram),
        ]),
      ]
    : findDirectKeywordMatches(input, keywordLists.haram);

  if (foundHaram.length > 0) {
    const fuzzyOnly =
      options.fuzzy &&
      findDirectKeywordMatches(input, keywordLists.haram).length === 0;
    return {
      status: "non_halal",
      reasons: [
        fuzzyOnly
          ? `Detected haram keywords from OCR correction: ${foundHaram.join(", ")}.`
          : `Detected haram keywords: ${foundHaram.join(", ")}.`,
      ],
      source: "ingredient_analysis",
    };
  }

  const foundSyubhah = options.fuzzy
    ? [
        ...new Set([
          ...findDirectKeywordMatches(input, keywordLists.syubhah),
          ...findFuzzyKeywordMatches(input, keywordLists.syubhah),
        ]),
      ]
    : findDirectKeywordMatches(input, keywordLists.syubhah);

  if (foundSyubhah.length > 0) {
    const fuzzyOnly =
      options.fuzzy &&
      findDirectKeywordMatches(input, keywordLists.syubhah).length === 0;
    return {
      status: "doubtful",
      reasons: [
        fuzzyOnly
          ? `Detected syubhah keywords from OCR correction: ${foundSyubhah.join(", ")}.`
          : `Detected syubhah keywords: ${foundSyubhah.join(", ")}.`,
      ],
      source: "ingredient_analysis",
    };
  }

  return {
    status: "halal",
    reasons: options.fuzzy
      ? [
          "No haram or syubhah keywords were detected in the scanned text.",
        ]
      : [
          "No haram or syubhah keywords were detected in your input for this first-phase checker.",
        ],
    source: "ingredient_analysis",
  };
}
