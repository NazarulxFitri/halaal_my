import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";

import type { KeywordCategory, KeywordLists } from "@/lib/types";

const DEFAULT_KEYWORDS: KeywordLists = {
  haram: [
    "pork",
    "babi",
    "khinzir",
    "lard",
    "arak",
    "wine",
    "beer",
    "rum",
    "vodka",
    "ham",
    "bacon",
  ],
  syubhah: [],
};

const dataDir = path.join(process.cwd(), "data");
const dataFile = path.join(dataDir, "keywords.json");
const legacyDataFile = path.join(dataDir, "haram-keywords.json");

function normalizeKeyword(keyword: string): string {
  return keyword.trim().toLowerCase();
}

function dedupeKeywords(keywords: string[]): string[] {
  return keywords
    .map(normalizeKeyword)
    .filter(Boolean)
    .filter((value, index, array) => array.indexOf(value) === index);
}

function normalizeLists(lists: KeywordLists): KeywordLists {
  return {
    haram: dedupeKeywords(lists.haram),
    syubhah: dedupeKeywords(lists.syubhah),
  };
}

function otherCategory(category: KeywordCategory): KeywordCategory {
  return category === "haram" ? "syubhah" : "haram";
}

async function ensureStore(): Promise<void> {
  await mkdir(dataDir, { recursive: true });

  try {
    await readFile(dataFile, "utf-8");
    return;
  } catch {
    // Continue to migration or default seed.
  }

  try {
    const legacyContent = await readFile(legacyDataFile, "utf-8");
    const legacyKeywords = JSON.parse(legacyContent) as string[];
    const migrated: KeywordLists = {
      haram: dedupeKeywords(legacyKeywords),
      syubhah: [],
    };
    await writeFile(dataFile, JSON.stringify(migrated, null, 2), "utf-8");
    return;
  } catch {
    // No legacy file; seed defaults.
  }

  await writeFile(
    dataFile,
    JSON.stringify(DEFAULT_KEYWORDS, null, 2),
    "utf-8",
  );
}

async function readLists(): Promise<KeywordLists> {
  await ensureStore();
  const content = await readFile(dataFile, "utf-8");
  const parsed = JSON.parse(content) as Partial<KeywordLists>;
  return normalizeLists({
    haram: Array.isArray(parsed.haram) ? parsed.haram : [],
    syubhah: Array.isArray(parsed.syubhah) ? parsed.syubhah : [],
  });
}

async function writeLists(lists: KeywordLists): Promise<KeywordLists> {
  const normalized = normalizeLists(lists);
  await writeFile(dataFile, JSON.stringify(normalized, null, 2), "utf-8");
  return normalized;
}

export async function getKeywordLists(): Promise<KeywordLists> {
  return readLists();
}

export type AddKeywordResult =
  | { ok: true; lists: KeywordLists }
  | {
      ok: false;
      conflict: true;
      keyword: string;
      existingCategory: KeywordCategory;
      lists: KeywordLists;
    };

export async function addKeyword(
  rawKeyword: string,
  category: KeywordCategory,
  move = false,
): Promise<AddKeywordResult> {
  const keyword = normalizeKeyword(rawKeyword);
  const lists = await readLists();

  if (!keyword) {
    return { ok: true, lists };
  }

  if (lists[category].includes(keyword)) {
    return { ok: true, lists };
  }

  const existingCategory = (["haram", "syubhah"] as const).find((entry) =>
    lists[entry].includes(keyword),
  );

  if (existingCategory && existingCategory !== category) {
    if (!move) {
      return {
        ok: false,
        conflict: true,
        keyword,
        existingCategory,
        lists,
      };
    }

    const updated = normalizeLists({
      ...lists,
      [existingCategory]: lists[existingCategory].filter(
        (entry) => entry !== keyword,
      ),
      [category]: [...lists[category], keyword],
    });
    return { ok: true, lists: await writeLists(updated) };
  }

  const updated = normalizeLists({
    ...lists,
    [category]: [...lists[category], keyword],
  });
  return { ok: true, lists: await writeLists(updated) };
}

export async function removeKeyword(
  rawKeyword: string,
  category: KeywordCategory,
): Promise<KeywordLists> {
  const keyword = normalizeKeyword(rawKeyword);
  const lists = await readLists();
  const updated = normalizeLists({
    ...lists,
    [category]: lists[category].filter((entry) => entry !== keyword),
  });
  return writeLists(updated);
}

export function findKeywordCategory(
  keyword: string,
  lists: KeywordLists,
): KeywordCategory | null {
  const normalized = normalizeKeyword(keyword);
  if (lists.haram.includes(normalized)) {
    return "haram";
  }
  if (lists.syubhah.includes(normalized)) {
    return "syubhah";
  }
  return null;
}

export { otherCategory };
