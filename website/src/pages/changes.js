import Head from "next/head";
import Changes from "@/components/changes";

export default function Page() {
  return (
    <>
      <Head>
        <title>FBI API | changes</title>
      </Head>
      <Changes />
    </>
  );
}
