import Script from "next/script";
import { useRouter } from "next/router";
import { useEffect } from "react";

export const GA_MEASUREMENT_ID =
  process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID ??
  process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID;

function isAdminPath(path: string): boolean {
  return path.startsWith("/admin");
}

export default function GoogleAnalytics() {
  const router = useRouter();

  useEffect(() => {
    if (!GA_MEASUREMENT_ID) {
      return;
    }

    const handleRouteChange = (url: string) => {
      if (isAdminPath(url)) {
        return;
      }

      window.gtag?.("config", GA_MEASUREMENT_ID, {
        page_path: url,
      });
    };

    router.events.on("routeChangeComplete", handleRouteChange);
    return () => {
      router.events.off("routeChangeComplete", handleRouteChange);
    };
  }, [router.events]);

  if (!GA_MEASUREMENT_ID || isAdminPath(router.pathname)) {
    return null;
  }

  return (
    <>
      <Script
        src={`https://www.googletagmanager.com/gtag/js?id=${GA_MEASUREMENT_ID}`}
        strategy="afterInteractive"
      />
      <Script id="google-analytics" strategy="afterInteractive">
        {`
          window.dataLayer = window.dataLayer || [];
          function gtag(){dataLayer.push(arguments);}
          gtag('js', new Date());
          gtag('config', '${GA_MEASUREMENT_ID}');
        `}
      </Script>
    </>
  );
}

declare global {
  interface Window {
    dataLayer?: unknown[];
    gtag?: (...args: unknown[]) => void;
  }
}
