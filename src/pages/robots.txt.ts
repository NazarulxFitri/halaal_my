import type { GetServerSideProps } from "next";

import { absoluteUrl, NOINDEX_PATHS } from "@/lib/site";

function buildRobotsTxt(): string {
  const disallowRules = [...NOINDEX_PATHS, "/api/"]
    .map((path) => `Disallow: ${path}`)
    .join("\n");

  return `User-agent: *
Allow: /
${disallowRules}

Sitemap: ${absoluteUrl("/sitemap.xml")}
`;
}

export const getServerSideProps: GetServerSideProps = async ({ res }) => {
  res.setHeader("Content-Type", "text/plain");
  res.write(buildRobotsTxt());
  res.end();
  return { props: {} };
};

export default function RobotsTxt() {
  return null;
}
