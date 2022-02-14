import nookies from "nookies";

import GraphiQL from "@/components/graphiql";

export default function Page({ token }) {
  console.log("token", { token });
  // Parse

  return (
    <div style={{ height: "100vh" }}>
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

  console.log("cookies", { cookies });

  // Destroy
  // nookies.destroy(ctx, 'cookieName')

  return { props: { token: cookies.token } };
}

// Page.getInitialProps = (ctx) => {
//   console.log("################# hest", { ctx });
//   const cookies = nookies.get(ctx, )
//   return cookies;
// };
