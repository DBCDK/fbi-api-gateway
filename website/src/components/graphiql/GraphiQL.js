import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/router";
import { GraphiQLInterface } from "graphiql";

import {
  GraphiQLProvider,
  useExecutionContext,
  useEditorContext,
  usePrettifyEditors,
} from "@graphiql/react";

import Header from "@/components/header";

import useStorage from "@/hooks/useStorage";
import useSchema, { useGraphQLUrl } from "@/hooks/useSchema";

import QueryDepthButton from "./buttons/depth";
import ComplexityButton from "./buttons/complexity";
import CurlButton from "./buttons/curl";

import styles from "./GraphiQL.module.css";
import useQuery from "@/hooks/useQuery";

export function GraphiQL({
  onEditQuery,
  onEditVariables,
  onTabChange,
  toolbar,
}) {
  const { tabs, activeTabIndex } = useEditorContext({
    nonNull: true,
  });

  const { run, isFetching } = useExecutionContext({
    caller: GraphiQL,
    nonNull: true,
  });

  const prettifyEditors = usePrettifyEditors();

  const tab = tabs[activeTabIndex];

  const [isReady, setIsReady] = useState(false);
  useEffect(() => {
    setIsReady(true);
  }, []);

  useEffect(() => {
    if (isReady) {
      if (!tab.response && tab.query && !isFetching) {
        try {
          prettifyEditors();
          run();
        } catch (err) {}
      }
    }
  }, [tab, isReady]);

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
        toolbar={toolbar}
      />
    </div>
  );
}

export default function Wrap() {
  const { selectedToken } = useStorage();
  const { schema } = useSchema(selectedToken);
  const url = useGraphQLUrl();

  const router = useRouter();

  const { params, initialParams } = useQuery();

  const [init, setInit] = useState(false);

  useEffect(() => {
    setInit(true);
  }, []);

  if (!init) {
    return null;
  }

  const fetcher = async ({ query, variables = {} }) => {
    if (!selectedToken?.token) {
      return {
        statusCode: 403,
        message: "Unauthorized",
      };
    }
    const data = await fetch(url, {
      method: "POST",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
        Authorization: `bearer ${selectedToken?.token}`,
      },
      body: JSON.stringify({ query, variables }),
      credentials: "same-origin",
    });

    return data.json().catch((e) => data.text(e));
  };

  function onEditQuery(newQuery) {
    params.query = newQuery;
    updateURL();
  }

  function onEditVariables(newVariables) {
    params.variables = newVariables;
    updateURL();
  }

  function onTabChange({ query: newQuery, variables: newVariables }) {
    params.query = newQuery;
    params.variables = newVariables;
    updateURL();
  }

  function updateURL() {
    router.replace({ query: params });
  }

  return (
    <GraphiQLProvider
      fetcher={fetcher}
      schema={schema}
      schemaDescription={true}
      query={params.query}
      variables={params.variables}
      operationName={params.operationName}
    >
      <GraphiQL
        toolbar={{
          additionalContent: [
            <CurlButton
              className={styles.curl}
              key="copy-curl-btn"
              caller={GraphiQL}
            />,

            <ComplexityButton
              {...params}
              className={styles.complexity}
              key="complexity-btn"
            />,

            <QueryDepthButton
              className={styles.depthButton}
              query={params.query || initialParams.query}
              key="query-depth-btn"
            />,
          ],
        }}
        onEditQuery={(newQuery) => onEditQuery(newQuery)}
        onEditVariables={(newVariables) => onEditVariables(newVariables)}
        onTabChange={onTabChange}
      />
    </GraphiQLProvider>
  );
}
