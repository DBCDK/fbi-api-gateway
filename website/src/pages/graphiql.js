import Head from "next/head";
import nookies from "nookies";

import GraphiQL from "@/components/graphiql";

export default function Page(props) {
  return (
    <>
      <Head>
        <title>FBI API | GraphiQL</title>
      </Head>
      <GraphiQL {...props} />
    </>
  );
}

// export async function getServerSideProps(ctx) {
//   // parse
//   const cookies = nookies.get(ctx);
//   return { props: { token: cookies.token } };
// }
