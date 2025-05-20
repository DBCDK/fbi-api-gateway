import { useEffect, useState, useRef, useCallback } from "react";
import { useRouter } from "next/router";
import { debounce } from "lodash";
import {
  GraphiQLProvider,
  useExecutionContext,
  useEditorContext,
  usePrettifyEditors,
} from "@graphiql/react";
import { GraphiQLInterface } from "graphiql";
import Header from "@/components/header";
import useStorage from "@/hooks/useStorage";
import useSchema, { useGraphQLUrl } from "@/hooks/useSchema";
import useExecute from "@/hooks/useExecute";
import useQuery from "@/hooks/useQuery";
import QueryDepthButton from "./buttons/depth";
import ComplexityButton from "./buttons/complexity";
import CurlButton from "./buttons/curl";

import styles from "./GraphiQL.module.css";

export function GraphiQL({
  onEditQuery,
  onEditVariables,
  onTabChange,
  settings,
  toolbar,
}) {
  console.log("################ render! 2");

  const { tabs, activeTabIndex } = useEditorContext({ nonNull: true });
  const { run, isFetching } = useExecutionContext({
    caller: GraphiQL,
    nonNull: true,
  });
  const prettifyEditors = usePrettifyEditors();
  const tab = tabs[activeTabIndex];

  const { execute } = settings;

  const [isReady, setIsReady] = useState(false);
  useEffect(() => {
    setIsReady(true);
  }, []);

  useEffect(() => {
    if (isReady && !tab.response && tab.query && !isFetching) {
      if (execute === "auto") {
        try {
          prettifyEditors();
          run();
        } catch (err) {}
      }
    }
  }, [tab, isReady, execute, isFetching, prettifyEditors, run]);

  useEffect(() => {
    onTabChange(tabs[activeTabIndex]);
  }, [activeTabIndex, onTabChange, tabs]);

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
  const { execute } = useExecute();
  const url = useGraphQLUrl();
  const router = useRouter();
  const { params, initialParams } = useQuery();

  const [init, setInit] = useState(false);
  const initialParamsUpdated = useRef(false);

  console.log("################ render! 1");

  useEffect(() => {
    setInit(true);
  }, []);

  const fetcher = async ({ query, variables = {} }) => {
    if (!selectedToken?.token) {
      return { statusCode: 403, message: "Unauthorized" };
    }

    const data = await fetch(url, {
      method: "POST",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
        Authorization: `bearer ${selectedToken?.token}`,
        "X-Tracking-Consent": "false",
        "X-Session-Token": "test-session-token",
      },
      body: JSON.stringify({ query, variables }),
      credentials: "same-origin",
    });

    return data.json().catch((e) => data.text(e));
  };

  function onEditQuery(newQuery) {
    const updatedParams = { ...params, query: newQuery };
    updateURL(updatedParams);
  }

  function onEditVariables(newVariables) {
    const updatedParams = { ...params, variables: newVariables };
    updateURL(updatedParams);
  }

  function onTabChange({ query: newQuery, variables: newVariables }) {
    // current params
    const { query, variables } = params;
    // updated params
    const updatedParams = {
      ...params,
      query: newQuery,
      variables: newVariables,
    };

    // Check if the new query and variables are different from the current ones
    const isEqual = (a, b) => {
      const toJsonString = (val) =>
        typeof val === "string" ? val : JSON.stringify(val);
      return toJsonString(a) === toJsonString(b);
    };

    // Update URL only if the query or variables have changed
    if (!(isEqual(query, newQuery) && isEqual(variables, newVariables))) {
      // Update URL
      updateURL(updatedParams);
    }
  }

  const updateURL = useCallback(
    debounce((updatedParams) => {
      router.replace({ query: updatedParams });
    }, 300),
    [router]
  );

  useEffect(() => {
    // Update URL only once with initialParams
    if (initialParams && !initialParamsUpdated.current) {
      router.replace({ query: initialParams });
      initialParamsUpdated.current = true; // Prevent future updates
    }
  }, [initialParams, router]);

  if (!init) {
    return null;
  }

  return (
    <GraphiQLProvider
      fetcher={fetcher}
      schema={schema}
      schemaDescription={true}
      query={initialParams.query}
      variables={initialParams.variables}
      operationName={initialParams.operationName}
    >
      <GraphiQL
        toolbar={{
          additionalContent: [
            <CurlButton className={styles.curl} key="copy-curl-btn" />,
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
        settings={{ execute }}
        // onEditQuery={() => {}}
        // onEditVariables={() => {}}
        // onTabChange={() => {}}
        onEditQuery={onEditQuery}
        onEditVariables={onEditVariables}
        onTabChange={onTabChange}
      />
    </GraphiQLProvider>
  );
}
