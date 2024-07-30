import Head from "next/head";
import Diff from "@/components/diff";

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
