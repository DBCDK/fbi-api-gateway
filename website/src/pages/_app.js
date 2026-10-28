import Head from "next/head";

import useMode from "@/hooks/useMode";
import useTheme, { ThemeContext } from "@/hooks/useTheme";

import "@/scss/custom-bootstrap.scss";
import "@/css/styles.css";
import WhatsNew from "@/components/whats-new";

function MyApp({ Component, pageProps, router }) {
  useMode();
  const { icon } = useTheme();

  return (
    <>
      <Head>
        <link
          rel="icon"
          href={`data:image/svg+xml,<svg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 100 100%22><text y=%22.9em%22 font-size=%2290%22>${icon}</text></svg>`}
        />
        <title>FBI API</title>
      </Head>
      <WhatsNew />
      <Component {...pageProps} />
    </>
  );
}
function AppWithTheme({ websiteTheme, ...props }) {
  return (
    <ThemeContext.Provider value={websiteTheme}>
      <MyApp {...props} />
    </ThemeContext.Provider>
  );
}

AppWithTheme.getInitialProps = async () => {
  // Client-side navigation reuses the theme supplied by the initial server render.
  const websiteTheme =
    typeof window === "undefined"
      ? process.env.WEBSITE_THEME || "default"
      : window.__NEXT_DATA__.props.websiteTheme || "default";
  return { websiteTheme };
};

export default AppWithTheme;
