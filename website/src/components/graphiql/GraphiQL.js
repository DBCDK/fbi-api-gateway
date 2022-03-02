import React, { useRef } from "react";
import _GraphiQL from "graphiql";

import useStorage from "@/hooks/useStorage";
import useSchema from "@/hooks/useSchema";

import Header from "@/components/header";

import styles from "./GraphiQL.module.css";

// A storage implementation that does nothing
// Basically prevents inline graphiql to interfere with the "real" graphiql
const noStorage = {
  getItem: () => {},
  removeItem: () => {},
  setItem: () => {},
  length: 0,
};
export function InlineGraphiQL({ query, variables }) {
  const { selectedToken } = useStorage();
  const instanceRef = useRef();
  const { schema } = useSchema(selectedToken);

  return (
    <div className={styles.inlinegraphiql}>
      <button
        onClick={() => {
          instanceRef.current.handleRunQuery();
        }}
      >
        RUN QUERY
      </button>{" "}
      <button
        onClick={() => {
          instanceRef.current.handlePrettifyQuery();
        }}
      >
        PRETTIFY
      </button>
      {schema && (
        <GraphiQLFix
          schema={schema}
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
          query={query}
          secondaryEditorOpen={true}
          variableEditorActive={true}
          variables={variables ? JSON.stringify(variables) : ""}
          headerEditorEnabled={false}
          secondaryEditorHeight={120}
          onMount={(instance) => {
            instanceRef.current = instance;
            instanceRef.current.handlePrettifyQuery();
            instanceRef.current.handleRunQuery();
          }}
          storage={noStorage}
        />
      )}
    </div>
  );
}

export default function GraphiQL() {
  const { selectedToken } = useStorage();
  const { schema } = useSchema(selectedToken);
  return (
    <div style={{ height: "100vh" }}>
      <Header />
      <GraphiQLFix
        schema={schema}
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
        headerEditorEnabled={false}
        secondaryEditorOpen={true}
        variableEditorActive={true}
      />
    </div>
  );
}

class GraphiQLFix extends _GraphiQL {
  constructor(props) {
    super(props);
    this.state = {
      ...this.state,
      secondaryEditorHeight:
        props.secondaryEditorHeight || this.state.secondaryEditorHeight,
    };
  }

  componentDidMount() {
    if (this.props.onMount) {
      this.props.onMount(this);
    }
    super.componentDidMount();
  }

  componentDidUpdate(...args) {
    const editor = this.getQueryEditor();
    if (editor && this.state.schema) {
      editor.state.lint.linterOptions.schema = this.state.schema;
    }
    return super.componentDidUpdate(...args);
  }
}
