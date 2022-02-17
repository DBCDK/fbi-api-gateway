import nookies from "nookies";

import Top from "@/components/topbar";
import GraphiQL from "@/components/graphiql";

export default function Page({ token }) {
  return (
    <div style={{ height: "100vh" }}>
      <Top />
      <GraphiQL
        fetcher={async (graphQLParams) => {
          const data = await fetch("http://localhost:3000/graphql", {
            method: "POST",
            headers: {
              Accept: "application/json",
              "Content-Type": "application/json",
              Authorization: `bearer ${token}`,
              //   Authorization: "bearer c03be2f3a435458389934fe0814bfdce8f1c21d2",
            },
            body: JSON.stringify(graphQLParams),
            credentials: "same-origin",
          });
          return data.json().catch(() => data.text());
        }}
      />
    </div>
  );
}

export async function getServerSideProps(ctx) {
  // parse
  const cookies = nookies.get(ctx);

  return { props: { token: cookies.token } };
}
