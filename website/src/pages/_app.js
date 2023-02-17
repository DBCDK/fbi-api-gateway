import { useEffect, useState } from "react";
import getConfig from "next/config";
import Head from "next/head";

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
      // Add class if system has darkmode enabled
      function setTheme(system) {
        const action = system.matches ? "add" : "remove";
        document.body.classList?.[action]("system-dark");
      }

      const system = window?.matchMedia("(prefers-color-scheme: dark)");
      setTheme(system);

      system.addEventListener("change", (e) => {
        setTheme(e);
      });
    }
  }, [ready]);

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
