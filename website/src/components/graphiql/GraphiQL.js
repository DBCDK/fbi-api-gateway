import React from "react";
import _GraphiQL from "graphiql";

import useToken from "@/hooks/useToken";

import Header from "@/components/header";

export default function GraphiQL() {
  const { token } = useToken();

  return (
    <div style={{ height: "100vh" }}>
      <Header />
      <GraphiQLFix
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

class GraphiQLFix extends _GraphiQL {
  componentDidUpdate(...args) {
    const editor = this.getQueryEditor();
    if (editor && this.state.schema) {
      editor.state.lint.linterOptions.schema = this.state.schema;
    }
    return super.componentDidUpdate(...args);
  }
}
