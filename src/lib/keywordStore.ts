import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";

import {
  getFirebaseDb,
  isFirebaseConfigured,
  KEYWORDS_COLLECTION,
  KEYWORDS_DOC,
} from "@/lib/firebaseAdmin";
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

function parseLists(data: Partial<KeywordLists> | undefined): KeywordLists {
  return normalizeLists({
    haram: Array.isArray(data?.haram) ? data.haram : [],
    syubhah: Array.isArray(data?.syubhah) ? data.syubhah : [],
  });
}

async function readBundledKeywords(): Promise<KeywordLists | null> {
  try {
    const content = await readFile(dataFile, "utf-8");
    return parseLists(JSON.parse(content) as Partial<KeywordLists>);
  } catch {
    return null;
  }
}

async function seedKeywords(): Promise<KeywordLists> {
  const bundled = await readBundledKeywords();
  if (bundled) {
    return bundled;
  }

  try {
    const legacyContent = await readFile(legacyDataFile, "utf-8");
    const legacyKeywords = JSON.parse(legacyContent) as string[];
    return normalizeLists({
      haram: dedupeKeywords(legacyKeywords),
      syubhah: [],
    });
  } catch {
    return DEFAULT_KEYWORDS;
  }
}

async function readListsFromFirebase(): Promise<KeywordLists> {
  const db = await getFirebaseDb();
  if (!db) {
    throw new Error("Firebase is not configured");
  }

  const docRef = db.collection(KEYWORDS_COLLECTION).doc(KEYWORDS_DOC);
  const snapshot = await docRef.get();

  if (!snapshot.exists) {
    const seeded = await seedKeywords();
    await docRef.set(seeded);
    return seeded;
  }

  return parseLists(snapshot.data() as Partial<KeywordLists>);
}

async function writeListsToFirebase(lists: KeywordLists): Promise<KeywordLists> {
  const db = await getFirebaseDb();
  if (!db) {
    throw new Error("Firebase is not configured");
  }

  const normalized = normalizeLists(lists);
  await db.collection(KEYWORDS_COLLECTION).doc(KEYWORDS_DOC).set(normalized);
  return normalized;
}

async function ensureLocalStore(): Promise<void> {
  await mkdir(dataDir, { recursive: true });

  try {
    await readFile(dataFile, "utf-8");
    return;
  } catch {
    // Continue to migration or default seed.
  }

  const seeded = await seedKeywords();
  await writeFile(dataFile, JSON.stringify(seeded, null, 2), "utf-8");
}

async function readListsFromFile(): Promise<KeywordLists> {
  await ensureLocalStore();
  const content = await readFile(dataFile, "utf-8");
  return parseLists(JSON.parse(content) as Partial<KeywordLists>);
}

async function writeListsToFile(lists: KeywordLists): Promise<KeywordLists> {
  const normalized = normalizeLists(lists);
  await writeFile(dataFile, JSON.stringify(normalized, null, 2), "utf-8");
  return normalized;
}

async function readLists(): Promise<KeywordLists> {
  if (isFirebaseConfigured()) {
    return readListsFromFirebase();
  }
  return readListsFromFile();
}

async function writeLists(lists: KeywordLists): Promise<KeywordLists> {
  if (isFirebaseConfigured()) {
    return writeListsToFirebase(lists);
  }
  return writeListsToFile(lists);
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
