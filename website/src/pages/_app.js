import getConfig from "next/config";
import nookies from "nookies";
import fetch from "isomorphic-unfetch";

const APP_URL =
  getConfig()?.publicRuntimeConfig?.app?.url || "http://localhost:3000";

import "@/scss/custom-bootstrap.scss";
import "@/css/styles.css";

function MyApp({ Component, pageProps }) {
  return <Component {...pageProps} />;
}

export default MyApp;

// export async function getServerSideProps(ctx) {

//   const cookies = nookies.get(ctx);
//   const token = cookies.token;

//   if (!token) {
//     return null;
//   }

//   if (token) {
//     const res = await fetch(`${APP_URL}/api/smaug?token=${token}`, {
//       method: "GET",
//     });

//     const configuration = await res.json();

//     return { props: { configuration, token } };
//   }
// }
