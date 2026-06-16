export const SITE_NAME = "Haalal.my";
export const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL ?? "https://haalal.my";

export const DEFAULT_DESCRIPTION =
  "Check if food is halal by typing ingredients or scanning product labels. Instant haram and syubhah keyword analysis for Malaysian consumers.";

export const HOME_TITLE = "Halal Food Checker | Check Ingredients & Labels";

export const SITE_ICON = "/saalam_xicon.png";

export const LOCALE_ALTERNATES = [
  { hrefLang: "en", path: "/" },
  { hrefLang: "x-default", path: "/" },
] as const;

export const PUBLIC_PATHS = ["/"] as const;

export const NOINDEX_PATHS = ["/admin"] as const;

function normalizePath(path: string): string {
  if (!path || path === "/") {
    return "/";
  }
  return path.startsWith("/") ? path : `/${path}`;
}

export function absoluteUrl(path = "/"): string {
  const normalized = normalizePath(path);
  if (normalized === "/") {
    return SITE_URL;
  }
  return `${SITE_URL}${normalized}`;
}
