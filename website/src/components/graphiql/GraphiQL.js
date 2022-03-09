import React, { useRef, useState } from "react";
import _GraphiQL from "graphiql";

import useStorage from "@/hooks/useStorage";
import useSchema from "@/hooks/useSchema";

import Button from "@/components/base/button";
import Input from "@/components/base/input";

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

  const [editQuery, setEditQuery] = useState(query);
  const [editVariables, setEditVariables] = useState(variables);

  const curl_vars = editVariables?.replace?.(/\s+/g, " ");
  const curl_query = editQuery?.replace(/\s+/g, " ");
  const curl = `curl -i -H "Authorization: bearer ${selectedToken}" -H "Content-Type: application/json" -X POST -d '{"query": "${curl_query}", "variables": ${curl_vars}}' ${window.location.origin}/graphql`;

  return (
    <div className={styles.inlinegraphiql}>
      <Button
        size="small"
        className={`${styles.button} ${styles.run}`}
        onClick={() => {
          instanceRef.current.handleRunQuery();
        }}
      >
        Run 🚀
      </Button>
      <Button
        secondary
        size="small"
        className={`${styles.button} ${styles.prettify}`}
        onClick={() => {
          instanceRef.current.handlePrettifyQuery();
        }}
      >
        Prettify ✨
      </Button>

      {/* <Button
        secondary
        size="small"
        className={`${styles.button} ${styles.copy}`}
        onClick={() => {
          instanceRef.current.handleCopyQuery();
        }}
      >
        Copy 🗐
      </Button> */}

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
          onEditQuery={(str) => setEditQuery(str)}
          onEditVariables={(str) => setEditVariables(str)}
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

      <Input
        value={curl}
        className={styles.curl}
        onClick={(e) => e.target.select()}
      />
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
