import Head from "next/head";

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
