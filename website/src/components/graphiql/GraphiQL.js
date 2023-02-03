import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import { GraphiQLInterface } from "graphiql";
import {
  GraphiQLProvider,
  useExecutionContext,
  useEditorContext,
  usePrettifyEditors,
} from "@graphiql/react";

import useStorage from "@/hooks/useStorage";
import useSchema, { useGraphQLUrl } from "@/hooks/useSchema";

import Header from "@/components/header";

import styles from "./GraphiQL.module.css";

export function GraphiQL({ onEditQuery, onEditVariables, onTabChange }) {
  const { tabs, activeTabIndex } = useEditorContext({
    nonNull: true,
  });

  const { run, isFetching } = useExecutionContext({
    nonNull: true,
  });

  const prettifyEditors = usePrettifyEditors();

  useEffect(() => {
    const tab = tabs[activeTabIndex];
    if (!tab.response && tab.query && !isFetching) {
      prettifyEditors?.();
      run?.();
    }
  }, [tabs[activeTabIndex]]);

  useEffect(() => {
    onTabChange(tabs[activeTabIndex]);
  }, [activeTabIndex]);

  return (
    <div className={styles.graphiql}>
      <Header />
      <GraphiQLInterface
        onEditQuery={onEditQuery}
        onEditVariables={onEditVariables}
        defaultEditorToolsVisibility="variables"
        isHeadersEditorEnabled={false}
        // toolbar={{ additionalContent: "hest" }}
      />
    </div>
  );
}

export default function Wrap() {
  const { selectedToken } = useStorage();
  const { schema } = useSchema(selectedToken);
  const url = useGraphQLUrl(selectedToken);

  const router = useRouter();

  const [show, setShow] = useState(false);
  useEffect(() => {
    setShow(true);
  }, []);
  if (!show) {
    return null;
  }

  const parameters = { ...router.query };

  const fetcher = async (graphQLParams) => {
    const data = await fetch(url, {
      method: "POST",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
        Authorization: `bearer ${selectedToken?.token}`,
      },
      body: JSON.stringify(graphQLParams),
      credentials: "same-origin",
    });
    return data.json().catch(() => data.text());
  };

  function onEditQuery(newQuery) {
    parameters.query = newQuery;
    updateURL();
  }

  function onEditVariables(newVariables) {
    parameters.variables = newVariables;
    updateURL();
  }

  function onTabChange({ query: newQuery, variables: newVariables }) {
    parameters.query = newQuery;
    parameters.variables = newVariables;
    updateURL();
  }

  function updateURL() {
    router.replace({ query: parameters });
  }

  return (
    <GraphiQLProvider
      fetcher={fetcher}
      schema={schema}
      schemaDescription={true}
      query={parameters.query}
      variables={parameters.variables}
      operationName={parameters.operationName}
    >
      <GraphiQL
        onEditQuery={onEditQuery}
        onEditVariables={onEditVariables}
        onTabChange={onTabChange}
      />
    </GraphiQLProvider>
  );
}
