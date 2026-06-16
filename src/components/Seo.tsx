import Head from "next/head";

import {
  absoluteUrl,
  DEFAULT_DESCRIPTION,
  LOCALE_ALTERNATES,
  SITE_ICON,
  SITE_NAME,
} from "@/lib/site";

type SeoProps = {
  title: string;
  description?: string;
  path?: string;
  noIndex?: boolean;
};

export default function Seo({
  title,
  description = DEFAULT_DESCRIPTION,
  path = "/",
  noIndex = false,
}: SeoProps) {
  const canonicalUrl = absoluteUrl(path);
  const fullTitle = path === "/" ? title : `${title} | ${SITE_NAME}`;
  const imageUrl = absoluteUrl(SITE_ICON);

  return (
    <Head>
      <title>{fullTitle}</title>
      <meta name="description" content={description} />
      <link rel="canonical" href={canonicalUrl} />

      {LOCALE_ALTERNATES.map((alternate) => (
        <link
          key={alternate.hrefLang}
          rel="alternate"
          hrefLang={alternate.hrefLang}
          href={absoluteUrl(alternate.path)}
        />
      ))}

      {noIndex ? (
        <meta name="robots" content="noindex, nofollow" />
      ) : (
        <meta name="robots" content="index, follow" />
      )}

      <meta property="og:type" content="website" />
      <meta property="og:site_name" content={SITE_NAME} />
      <meta property="og:title" content={fullTitle} />
      <meta property="og:description" content={description} />
      <meta property="og:url" content={canonicalUrl} />
      <meta property="og:locale" content="en_MY" />
      <meta property="og:image" content={imageUrl} />

      <meta name="twitter:card" content="summary" />
      <meta name="twitter:title" content={fullTitle} />
      <meta name="twitter:description" content={description} />
      <meta name="twitter:image" content={imageUrl} />
    </Head>
  );
}
