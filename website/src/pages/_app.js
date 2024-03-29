import Head from "next/head";

import useTheme from "@/hooks/useTheme";

import "@/scss/custom-bootstrap.scss";
import "@/css/styles.css";

function MyApp({ Component, pageProps, router }) {
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
      <Component {...pageProps} />
    </>
  );
}
MyApp.getInitialProps = async () => {
  return {};
};

export default MyApp;
