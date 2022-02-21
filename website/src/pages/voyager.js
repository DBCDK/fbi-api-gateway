import Head from "next/head";
import Top from "@/components/topbar";
import Voyager from "@/components/voyager";

export default function Page(props) {
  return (
    <>
      <Head>
        <title>Voyager</title>
      </Head>
      <div style={{ height: "100vh" }}>
        <Top />
        <Voyager />
      </div>
    </>
  );
}
