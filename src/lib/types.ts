export type KeywordCategory = "haram" | "syubhah";

export type KeywordLists = {
  haram: string[];
  syubhah: string[];
};

export type HalalStatus = "halal" | "non_halal" | "doubtful" | "unknown";

export type ResultSource = "jakim" | "ingredient_analysis" | "unknown";

export type HalalCheckResult = {
  status: HalalStatus;
  reasons: string[];
  source: ResultSource;
};

export type ProductRecord = {
  id: string;
  name: string;
  brand: string;
  halal_status: "halal" | "non_halal" | "unknown";
  source: "jakim" | "manual";
  last_updated: string;
};
