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
import Spinner from "@/components/base/spinner";
import useSchema, { useGraphQLUrl } from "@/hooks/useSchema";
import useExecute from "@/hooks/useExecute";
import useQuery from "@/hooks/useQuery";
import useEffectiveSelectedCredential from "@/hooks/credentials/useEffectiveSelectedCredential";
import QueryDepthButton from "./buttons/depth";
import ComplexityButton from "./buttons/complexity";
import CurlButton from "./buttons/curl";

import styles from "./GraphiQL.module.css";

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

export function GraphiQL({
  onEditQuery,
  onEditVariables,
  onTabChange,
  settings,
  toolbar,
}) {
  const { tabs, activeTabIndex } = useEditorContext({ nonNull: true });
  const { run, isFetching } = useExecutionContext({
    caller: GraphiQL,
    nonNull: true,
  });
  const prettifyEditors = usePrettifyEditors();
  const tab = tabs?.[activeTabIndex] || null;

  const { execute } = settings;

  const [isReady, setIsReady] = useState(false);
  useEffect(() => {
    setIsReady(true);
  }, []);

  useEffect(() => {
    if (!isReady || !tab || isFetching || execute !== "auto") {
      return;
    }

    if (!tab.response && tab.query) {
      try {
        prettifyEditors();
        run();
      } catch (err) {}
    }
  }, [tab, isReady, execute, isFetching, prettifyEditors, run]);

  useEffect(() => {
    if (tab) {
      onTabChange(tab);
    }
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
  const { effectiveCredential } = useEffectiveSelectedCredential();
  const { schema, isLoading: isSchemaLoading } = useSchema(effectiveCredential);
  const { execute } = useExecute();
  const url = useGraphQLUrl();
  const urlRef = useRef(url);
  const router = useRouter();
  const { params, initialParams } = useQuery();

  const [init, setInit] = useState(false);
  const initialParamsUpdated = useRef(false);

  useEffect(() => {
    setInit(true);
  }, []);

  useEffect(() => {
    urlRef.current = url;
  }, [url]);

  async function waitForGraphQLEndpoint() {
    for (let attempt = 0; attempt < 5; attempt += 1) {
      if (urlRef.current) {
        return urlRef.current;
      }

      await sleep(150);
    }

    return null;
  }

  const fetcher = async ({ query, variables = {} }) => {
    if (!effectiveCredential?.token) {
      return { statusCode: 403, message: "Unauthorized" };
    }
    const endpoint = await waitForGraphQLEndpoint();

    if (!endpoint) {
      return {
        errors: [
          {
            message: "GraphiQL is still preparing the GraphQL endpoint. Please try again.",
          },
        ],
      };
    }

    const data = await fetch(endpoint, {
      method: "POST",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
        Authorization: `bearer ${effectiveCredential?.token}`,
        "X-Tracking-Consent": "false",
        "X-Session-Token": "test-session-token",
      },
      body: JSON.stringify({ query, variables }),
      credentials: "same-origin",
    });

    const body = await data.text();

    try {
      return JSON.parse(body);
    } catch {
      return body;
    }
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
    if (typeof newQuery === "undefined" && typeof newVariables === "undefined") {
      return;
    }

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

  if (effectiveCredential?.token && (!url || isSchemaLoading)) {
    return (
      <div className={styles.graphiql}>
        <Header />
        <div
          style={{
            minHeight: "60vh",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            flexDirection: "column",
            gap: "1rem",
          }}
        >
          <Spinner />
          <div>Preparing GraphiQL…</div>
        </div>
      </div>
    );
  }

  const graphiqlParams = initialParams || {
    query: "",
    variables: "",
    operationName: undefined,
  };

  return (
    <GraphiQLProvider
      fetcher={fetcher}
      schema={schema}
      schemaDescription={true}
      query={graphiqlParams.query}
      variables={graphiqlParams.variables}
      operationName={graphiqlParams.operationName}
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
              query={params.query || graphiqlParams.query}
              key="query-depth-btn"
            />,
          ],
        }}
        settings={{ execute }}
        onEditQuery={onEditQuery}
        onEditVariables={onEditVariables}
        onTabChange={onTabChange}
      />
    </GraphiQLProvider>
  );
}
