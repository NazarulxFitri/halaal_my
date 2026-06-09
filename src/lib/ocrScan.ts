import type { KeywordLists } from "@/lib/types";

import {
  findDirectKeywordMatches,
  findFuzzyKeywordMatches,
} from "./ocrFuzzyMatch";
import { preprocessImageForOcr } from "./imagePreprocess";

type OcrCandidate = {
  text: string;
  confidence: number;
  directMatches: number;
  fuzzyMatches: number;
};

const PSM_MODES = [
  "SINGLE_BLOCK",
  "SINGLE_LINE",
  "SINGLE_WORD",
  "RAW_LINE",
] as const;

function scoreCandidate(
  text: string,
  confidence: number,
  keywordLists: KeywordLists,
): OcrCandidate {
  const directHaram = findDirectKeywordMatches(text, keywordLists.haram);
  const directSyubhah = findDirectKeywordMatches(text, keywordLists.syubhah);
  const fuzzyHaram = findFuzzyKeywordMatches(text, keywordLists.haram);
  const fuzzySyubhah = findFuzzyKeywordMatches(text, keywordLists.syubhah);

  return {
    text: text.trim(),
    confidence,
    directMatches: directHaram.length + directSyubhah.length,
    fuzzyMatches:
      fuzzyHaram.length +
      fuzzySyubhah.length -
      directHaram.length -
      directSyubhah.length,
  };
}

function pickBestCandidate(candidates: OcrCandidate[]): OcrCandidate {
  const nonEmpty = candidates.filter((candidate) => candidate.text.length > 0);
  if (nonEmpty.length === 0) {
    return candidates[0] ?? { text: "", confidence: 0, directMatches: 0, fuzzyMatches: 0 };
  }

  return nonEmpty.sort((left, right) => {
    if (right.directMatches !== left.directMatches) {
      return right.directMatches - left.directMatches;
    }
    if (right.fuzzyMatches !== left.fuzzyMatches) {
      return right.fuzzyMatches - left.fuzzyMatches;
    }
    return right.confidence - left.confidence;
  })[0];
}

async function recognizeWithModes(
  image: HTMLCanvasElement | File,
  keywordLists: KeywordLists,
): Promise<OcrCandidate[]> {
  const { createWorker, PSM } = await import("tesseract.js");
  const worker = await createWorker("eng");
  const candidates: OcrCandidate[] = [];

  try {
    await worker.setParameters({
      user_defined_dpi: "300",
      load_system_dawg: "0",
      load_freq_dawg: "0",
    });

    for (const mode of PSM_MODES) {
      await worker.setParameters({
        tessedit_pageseg_mode: PSM[mode],
      });
      const { data } = await worker.recognize(image);
      candidates.push(scoreCandidate(data.text, data.confidence, keywordLists));
    }
  } finally {
    await worker.terminate();
  }

  return candidates;
}

export type OcrScanResult = {
  text: string;
  usedFuzzyKeywordMatch: boolean;
};

export async function scanImageForText(
  file: File,
  keywordLists: KeywordLists,
): Promise<OcrScanResult> {
  const preprocessed = await preprocessImageForOcr(file);
  const [originalCandidates, enhancedCandidates] = await Promise.all([
    recognizeWithModes(file, keywordLists),
    recognizeWithModes(preprocessed, keywordLists),
  ]);

  const best = pickBestCandidate([...originalCandidates, ...enhancedCandidates]);
  const directHaram = findDirectKeywordMatches(best.text, keywordLists.haram);
  const directSyubhah = findDirectKeywordMatches(best.text, keywordLists.syubhah);
  const fuzzyHaram = findFuzzyKeywordMatches(best.text, keywordLists.haram);
  const fuzzySyubhah = findFuzzyKeywordMatches(best.text, keywordLists.syubhah);

  const usedFuzzyKeywordMatch =
    (fuzzyHaram.length > 0 || fuzzySyubhah.length > 0) &&
    directHaram.length === 0 &&
    directSyubhah.length === 0;

  return {
    text: best.text,
    usedFuzzyKeywordMatch,
  };
}
