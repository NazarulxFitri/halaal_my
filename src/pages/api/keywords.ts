import type { NextApiRequest, NextApiResponse } from "next";

import { isAdminAuthenticated } from "@/lib/adminAuth";
import {
  addKeyword,
  getKeywordLists,
  removeKeyword,
} from "@/lib/keywordStore";
import type { KeywordCategory, KeywordLists } from "@/lib/types";

type KeywordsResponse = KeywordLists & {
  error?: string;
  conflict?: {
    keyword: string;
    existingCategory: KeywordCategory;
  };
};

function isKeywordCategory(value: string): value is KeywordCategory {
  return value === "haram" || value === "syubhah";
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<KeywordsResponse>,
) {
  if (req.method === "GET") {
    const lists = await getKeywordLists();
    res.status(200).json(lists);
    return;
  }

  if (req.method === "POST" || req.method === "DELETE") {
    if (!isAdminAuthenticated(req)) {
      res.status(401).json({
        haram: [],
        syubhah: [],
        error: "Unauthorized",
      });
      return;
    }
  }

  if (req.method === "POST") {
    const keyword = String(req.body?.keyword ?? "");
    const category = String(req.body?.category ?? "");
    const move = Boolean(req.body?.move);

    if (!isKeywordCategory(category)) {
      res.status(400).json({
        haram: [],
        syubhah: [],
        error: "Invalid category",
      });
      return;
    }

    const result = await addKeyword(keyword, category, move);
    if (!result.ok) {
      res.status(409).json({
        ...result.lists,
        conflict: {
          keyword: result.keyword,
          existingCategory: result.existingCategory,
        },
      });
      return;
    }

    res.status(200).json(result.lists);
    return;
  }

  if (req.method === "DELETE") {
    const keyword = String(req.body?.keyword ?? "");
    const category = String(req.body?.category ?? "");

    if (!isKeywordCategory(category)) {
      res.status(400).json({
        haram: [],
        syubhah: [],
        error: "Invalid category",
      });
      return;
    }

    const lists = await removeKeyword(keyword, category);
    res.status(200).json(lists);
    return;
  }

  res.status(405).json({
    haram: [],
    syubhah: [],
    error: "Method not allowed",
  });
}
