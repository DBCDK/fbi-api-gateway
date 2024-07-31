import Head from "next/head";
import Diff from "@/components/changes";

export default function Page() {
  return (
    <>
      <Head>
        <title>FBI API | Diff</title>
      </Head>
      <Diff />
    </>
  );
}
