import { useEffect } from "react";
import getConfig from "next/config";

import "@/scss/custom-bootstrap.scss";
import "@/css/styles.css";

const isChristmas = getConfig()?.publicRuntimeConfig?.isChristmas;

function MyApp({ Component, pageProps, router }) {
  const isChristmasClass = isChristmas ? "christmas" : "not-christmas";

  useEffect(() => {
    document.body.classList.add(isChristmasClass);
  });

  return <Component {...pageProps} />;
}
MyApp.getInitialProps = async () => {
  return {};
};

export default MyApp;
