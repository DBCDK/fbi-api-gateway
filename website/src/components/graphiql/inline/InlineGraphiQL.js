import { useEffect, useRef, useState } from "react";
import { GraphiQLInterface } from "graphiql";

import {
  GraphiQLProvider,
  useExecutionContext,
  useEditorContext,
  usePrettifyEditors,
} from "@graphiql/react";

import useStorage from "@/hooks/useStorage";
import useSchema, { useGraphQLUrl } from "@/hooks/useSchema";
import useIntersection from "@/hooks/useIntersection";

import Text from "@/components/base/text";
import Button from "@/components/base/button";
import Input from "@/components/base/input";

import Overlay from "@/components/base/overlay";

import styles from "./InlineGraphiQL.module.css";

// A storage implementation that does nothing
// Basically prevents inline graphiql to interfere with the "real" graphiql
const noStorage = {
  getItem: () => {},
  removeItem: () => {},
  setItem: () => {},
  length: 0,
};

/**
 * Shows an empy grey box, calls inView when box is in viewport.
 * Used for lazy loading
 *
 * @param {*} props
 * @param {function} props.inView
 * @param {boolean} props.show
 * @returns {component}
 */
function DummyContainer({ inView, show }) {
  const dummyContainerRef = useRef();
  const dummyContainerInView = useIntersection(
    dummyContainerRef.current,
    "0px"
  );
  useEffect(() => {
    if (dummyContainerInView) {
      inView?.(true);
    }
  }, [dummyContainerInView]);
  return (
    <div
      className={styles.dummycontainer}
      ref={dummyContainerRef}
      style={{ display: show ? "block" : "none" }}
    />
  );
}

/**
 *
 * @param {*} parameters
 * @returns
 */

function generateGraphiqlURL(parameters) {
  const origin = window.location.origin;
  const path = origin + "/graphiql";

  const params = Object.keys(parameters)
    .filter((key) => Boolean(parameters[key]))
    .map((key) => key + "=" + encodeURIComponent(parameters[key]))
    .join("&");

  return path + "?" + params;
}

/**
 *
 * @param {*} param0
 * @returns
 */

export function InlineGraphiQL({ query, variables }) {
  if (typeof window === "undefined") {
    return null;
  }

  const { tabs, activeTabIndex } = useEditorContext({
    nonNull: true,
  });

  const { run, isFetching } = useExecutionContext({
    nonNull: true,
  });

  const prettifyEditors = usePrettifyEditors();

  const { selectedToken } = useStorage();

  // This is used for lazy loading
  const [showDummyContainer, setShowDummyContainer] = useState(true);

  const curlRef = useRef();
  const url = useGraphQLUrl();

  const [showCopy, setShowCopy] = useState(false);
  const [editQuery, setEditQuery] = useState(query);
  const [editVariables, setEditVariables] = useState(variables);

  const curl_vars = editVariables?.replace?.(/\s+/g, " ");
  const curl_query = editQuery?.replace(/\s+/g, " ");
  const curl = `curl -H "Authorization: bearer ${selectedToken?.token}" -H "Content-Type: application/json" -X POST -d '{"query": "${curl_query}", "variables": ${curl_vars}}' ${url}`;

  const graphiqlUrl = generateGraphiqlURL({
    query: editQuery,
    variables: editVariables,
  });

  // When the selected token has changed, we unmount graphiql
  // and mounts the dummy container. Graphiql will be reinstantiated
  // when the dummy container is in the viewport again
  useEffect(() => {
    setShowDummyContainer(true);
  }, [selectedToken]);

  useEffect(() => {
    const tab = tabs[activeTabIndex];
    if (!tab.response && !!tab.query && !isFetching) {
      prettifyEditors();
      run();
    }
  }, [tabs]);

  return (
    <div className={styles.inlinegraphiql}>
      <div className={styles.buttons}>
        <Button
          size="small"
          className={`${styles.button} ${styles.run}`}
          onClick={() => !isFetching && run()}
        >
          Run 🏃 {/*🚀*/}
        </Button>

        <Button
          secondary
          size="small"
          className={`${styles.button} ${styles.prettify}`}
          onClick={() => prettifyEditors()}
        >
          Prettify ✨
        </Button>

        <Button
          secondary
          size="small"
          className={`${styles.button} ${styles.open}`}
          onClick={() => window.open(graphiqlUrl, "_blank")}
        >
          Open in GraphiQL 🛰️
        </Button>
      </div>

      <DummyContainer
        inView={() => setShowDummyContainer(false)}
        show={showDummyContainer}
      />

      {!showDummyContainer && (
        <GraphiQLInterface
          onEditQuery={(str) => setEditQuery(str)}
          onEditVariables={(str) => setEditVariables(str)}
          isHeadersEditorEnabled={false}
        />
      )}

      <Input
        elRef={curlRef}
        value={curl}
        readOnly={true}
        className={styles.curl}
        onClick={(e) => {
          e.target.select();
          navigator?.clipboard?.writeText?.(e.target.value);
          setShowCopy(true);
          setTimeout(() => setShowCopy(false), 2000);
        }}
      />

      <Overlay show={navigator?.clipboard && showCopy} container={curlRef}>
        <Text type="text1">Copied to clipboard 📋</Text>
      </Overlay>
    </div>
  );
}

export default function Wrap(props) {
  const { query, variables } = props;

  const { selectedToken } = useStorage();
  const { schema } = useSchema(selectedToken);

  const url = useGraphQLUrl(selectedToken);

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

  return (
    <GraphiQLProvider
      fetcher={fetcher}
      schema={schema}
      query={query}
      storage={noStorage}
      variables={variables ? JSON.stringify(variables) : ""}
    >
      <InlineGraphiQL {...props} />
    </GraphiQLProvider>
  );
}
