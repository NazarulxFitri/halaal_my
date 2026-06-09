import type { KeywordCategory } from "@/lib/types";

export function categoryLabel(category: KeywordCategory): string {
  return category === "haram" ? "Haram" : "Syubhah";
}
