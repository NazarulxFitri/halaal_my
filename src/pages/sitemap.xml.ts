import type { GetServerSideProps } from "next";

import { absoluteUrl, PUBLIC_PATHS } from "@/lib/site";

function buildSitemap(): string {
  const lastmod = new Date().toISOString().split("T")[0];
  const urls = PUBLIC_PATHS.map(
    (path) => `  <url>
    <loc>${absoluteUrl(path)}</loc>
    <lastmod>${lastmod}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>${path === "/" ? "1.0" : "0.8"}</priority>
  </url>`,
  ).join("\n");

  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls}
</urlset>`;
}

export const getServerSideProps: GetServerSideProps = async ({ res }) => {
  res.setHeader("Content-Type", "text/xml");
  res.write(buildSitemap());
  res.end();
  return { props: {} };
};

export default function Sitemap() {
  return null;
}
