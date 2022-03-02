import React from "react";
import _GraphiQL from "graphiql";

import useStorage from "@/hooks/useStorage";

import Header from "@/components/header";

export default function GraphiQL() {
  const { selectedToken } = useStorage();
  return (
    <div style={{ height: "100vh" }}>
      <Header />
      <GraphiQLFix
        fetcher={async (graphQLParams) => {
          const data = await fetch("/graphql", {
            method: "POST",
            headers: {
              Accept: "application/json",
              "Content-Type": "application/json",
              Authorization: `bearer ${selectedToken}`,
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
