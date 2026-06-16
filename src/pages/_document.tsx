import { Html, Head, Main, NextScript } from "next/document";

import { SITE_ICON } from "@/lib/site";

export default function Document() {
  return (
    <Html lang="en">
      <Head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <meta
          name="google-adsense-account"
          content="ca-pub-1764114704213994"
        />
        <link rel="icon" href={SITE_ICON} type="image/png" />
        <link rel="apple-touch-icon" href={SITE_ICON} />
      </Head>
      <body>
        <Main />
        <NextScript />
      </body>
    </Html>
  );
}
