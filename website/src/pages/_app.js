import { useEffect } from "react";
import { useState } from "react";
import getConfig from "next/config";
import Head from "next/head";

import useTheme from "@/hooks/useTheme";

import "@/scss/custom-bootstrap.scss";
import "@/css/styles.css";

const theme = getConfig()?.publicRuntimeConfig?.theme;

let favIcon = "🥳";
if (theme === "christmas") {
  favIcon = "🎅";
}
if (theme === "easter") {
  favIcon = "🐤";
}

function MyApp({ Component, pageProps, router }) {
  const [ready, setReady] = useState(false);
  const { theme: selected, isLoading } = useTheme();

  useEffect(() => {
    document.body.classList?.add(theme);
  });

  useEffect(() => {
    if (!ready) {
      setReady(true);
    }
  }, []);

  useEffect(() => {
    if (ready) {
      if (!isLoading) {
        // Add class if system has darkmode enabled
        function setTheme(mode) {
          if (mode === "dark") {
            document.body.classList?.add("dark");
            document.body.classList?.remove("light");
          }
          if (mode === "light") {
            document.body.classList?.remove("dark");
            document.body.classList?.add("light");
          }
        }

        const matchMedia = window?.matchMedia("(prefers-color-scheme: dark)");
        const system = matchMedia.matches ? "dark" : "light";

        setTheme(selected || system);

        matchMedia.addEventListener("change", (e) => {
          console.log("e", e);

          const system = e.matches ? "dark" : "light";
          setTheme(selected || system);
        });
      }
    }
  }, [ready, selected, isLoading]);

  return (
    <>
      <Head>
        <link
          rel="icon"
          href={`data:image/svg+xml,<svg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 100 100%22><text y=%22.9em%22 font-size=%2290%22>${favIcon}</text></svg>`}
        />
        <title>FBI API</title>
      </Head>
      <Component {...pageProps} />
    </>
  );
}
MyApp.getInitialProps = async () => {
  return {};
};

export default MyApp;
