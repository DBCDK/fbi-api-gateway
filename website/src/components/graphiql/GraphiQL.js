import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/router";
import { GraphiQLInterface } from "graphiql";
import {
  GraphiQLProvider,
  useExecutionContext,
  useEditorContext,
  usePrettifyEditors,
  ToolbarButton,
} from "@graphiql/react";

import { generateCurl } from "@/components/utils";

import Text from "@/components/base/text";
import Overlay from "@/components/base/overlay";

import useStorage from "@/hooks/useStorage";
import useSchema, { useGraphQLUrl } from "@/hooks/useSchema";

import Header from "@/components/header";

import styles from "./GraphiQL.module.css";

function CurlButton({ onClick }) {
  const curlRef = useRef();
  const [showCopy, setShowCopy] = useState(false);

  return (
    <span ref={curlRef} className={styles.curl}>
      <ToolbarButton
        className={styles.button}
        onClick={() => {
          onClick();
          setShowCopy(true);
          setTimeout(() => setShowCopy(false), 2000);
        }}
        label="Copy curl"
      >
        <Text type="text1">curl</Text>
      </ToolbarButton>
      <Overlay show={navigator?.clipboard && showCopy} container={curlRef}>
        <Text type="text1">Copied to clipboard 📋</Text>
      </Overlay>
    </span>
  );
}

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
  const url = useGraphQLUrl(selectedToken);

  const router = useRouter();

  const parameters = { ...router.query };

  const curl = generateCurl({
    ...parameters,
    url,
    token: selectedToken?.token,
  });

  const [show, setShow] = useState(false);
  useEffect(() => {
    setShow(true);
  }, []);
  if (!show) {
    return null;
  }

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
        toolbar={{
          additionalContent: [
            <CurlButton
              key="copy-curl-btn"
              onClick={() => navigator?.clipboard?.writeText?.(curl)}
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
