import GraphiQL from "@/components/graphiql";

export default function Page() {
  return (
    <div style={{ height: "100vh" }}>
      <GraphiQL
        fetcher={async (graphQLParams) => {
          const data = await fetch("http://localhost:3000/graphql", {
            method: "POST",
            headers: {
              Accept: "application/json",
              "Content-Type": "application/json",
              Authorization: "bearer c03be2f3a435458389934fe0814bfdce8f1c21d2",
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
