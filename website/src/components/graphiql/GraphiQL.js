import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/router";
import { GraphiQLInterface } from "graphiql";

import {
  GraphiQLProvider,
  useExecutionContext,
  useEditorContext,
  usePrettifyEditors,
} from "@graphiql/react";

import { generateCurl } from "@/components/utils";

import Header from "@/components/header";

import useStorage from "@/hooks/useStorage";
import useSchema, { useGraphQLUrl } from "@/hooks/useSchema";

import QueryDepthButton from "./buttons/depth";
import ComplexityButton from "./buttons/complexity";
import CurlButton from "./buttons/curl";

import styles from "./GraphiQL.module.css";

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

  const parameters = { ...router.query };

  const curl = generateCurl({
    ...parameters,
    url,
    token: selectedToken?.token,
  });

  const [initQueryParams, setInitQueryParams] = useState();

  useEffect(() => {
    setInitQueryParams(parameters);
  }, []);

  if (!initQueryParams) {
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
      query={initQueryParams.query}
      variables={initQueryParams.variables}
      operationName={initQueryParams.operationName}
    >
      <GraphiQL
        toolbar={{
          additionalContent: [
            <CurlButton
              className={styles.curl}
              key="copy-curl-btn"
              onClick={() => navigator?.clipboard?.writeText?.(curl)}
            />,

            <ComplexityButton
              {...parameters}
              className={styles.complexity}
              key="complexity-btn"
            />,

            <QueryDepthButton
              className={styles.depthButton}
              query={parameters.query || initQueryParams.query}
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
