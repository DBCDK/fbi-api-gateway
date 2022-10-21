import { useEffect } from "react";

import "@/scss/custom-bootstrap.scss";
import "@/css/styles.css";

function MyApp({ Component, pageProps, router }) {
  const isChristmas = process.env.isChristmas;

  console.log(process.env.isChristmas);

  const isChristmasClass = isChristmas ? "christmas" : "not-christmas";

  useEffect(() => {
    document.body.classList.add(isChristmasClass);
  });

  return <Component {...pageProps} />;
}

export default MyApp;
