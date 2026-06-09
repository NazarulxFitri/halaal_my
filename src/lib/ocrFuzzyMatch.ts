function escapeRegex(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function ocrCharPattern(char: string): string {
  const lower = char.toLowerCase();
  switch (lower) {
    case "a":
      return "[aA4@]";
    case "b":
      return "[bB862]";
    case "c":
      return "[cC(]";
    case "d":
      return "[dD]";
    case "e":
      return "[eE3]";
    case "f":
      return "[fF]";
    case "g":
      return "[gG69]";
    case "h":
      return "[hH]";
    case "i":
      return "[iIlL1|7]";
    case "j":
      return "[jJ]";
    case "k":
      return "[kK]";
    case "l":
      return "[lLiI1|]";
    case "m":
      return "[mM]";
    case "n":
      return "[nN]";
    case "o":
      return "[oO0]";
    case "p":
      return "[pP]";
    case "q":
      return "[qQ]";
    case "r":
      return "[rR]";
    case "s":
      return "[sS5$]";
    case "t":
      return "[tT7+]";
    case "u":
      return "[uU]";
    case "v":
      return "[vV]";
    case "w":
      return "[wW]";
    case "x":
      return "[xX]";
    case "y":
      return "[yY]";
    case "z":
      return "[zZ2]";
    default:
      return escapeRegex(char);
  }
}

export function buildKeywordPattern(keyword: string): RegExp {
  const pattern = keyword
    .split("")
    .map((char) => ocrCharPattern(char))
    .join("");
  return new RegExp(pattern, "i");
}

export function findDirectKeywordMatches(
  text: string,
  keywords: string[],
): string[] {
  const normalized = text.trim().toLowerCase();
  return keywords.filter((keyword) => normalized.includes(keyword));
}

export function findFuzzyKeywordMatches(
  text: string,
  keywords: string[],
): string[] {
  const compact = text.replace(/\s+/g, "");
  return keywords.filter((keyword) => buildKeywordPattern(keyword).test(compact));
}
