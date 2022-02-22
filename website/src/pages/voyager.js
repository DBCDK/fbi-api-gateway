import Head from "next/head";
import Header from "@/components/header";
import Voyager from "@/components/voyager";

export default function Page(props) {
  return (
    <>
      <Head>
        <title>Voyager</title>
      </Head>
      <div style={{ height: "100vh" }}>
        <Header />
        <Voyager />
      </div>
    </>
  );
}
