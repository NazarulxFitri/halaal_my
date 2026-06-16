import "@/styles/globals.css";
import { CssBaseline, ThemeProvider } from "@mui/material";
import type { AppProps } from "next/app";

import GoogleAnalytics from "@/components/GoogleAnalytics";
import theme from "@/theme";

export default function App({ Component, pageProps }: AppProps) {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <GoogleAnalytics />
      <Component {...pageProps} />
    </ThemeProvider>
  );
}
