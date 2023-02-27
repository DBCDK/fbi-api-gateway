import { useEffect, useRef, useState } from "react";
import { GraphiQLInterface } from "graphiql";

import {
  GraphiQLProvider,
  useExecutionContext,
  useEditorContext,
  usePrettifyEditors,
} from "@graphiql/react";

import { generateCurl } from "@/components/utils";

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
    <div className={styles.inlinegraphiql}>
      <div
        className={styles.dummycontainer}
        ref={dummyContainerRef}
        style={{ display: show ? "block" : "none" }}
      />
    </div>
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

export function InlineGraphiQL({
  query,
  variables,
  onEditQuery,
  onEditVariables,
}) {
  const { tabs, activeTabIndex } = useEditorContext({
    nonNull: true,
  });

  const { run, isFetching } = useExecutionContext({
    nonNull: true,
  });

  const prettifyEditors = usePrettifyEditors();

  const { selectedToken } = useStorage();
  const url = useGraphQLUrl(selectedToken);

  const [isReady, setIsReady] = useState(false);

  const curlRef = useRef();
  const [showCopy, setShowCopy] = useState(false);

  const curl = generateCurl({
    url,
    token: selectedToken?.token,
    query,
    variables,
  });

  const graphiqlUrl = generateGraphiqlURL({
    query,
    variables,
  });

  useEffect(() => {
    setIsReady(true);
  }, []);

  const tab = tabs[activeTabIndex];
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

  return (
    <div className={`${styles.inlinegraphiql} inlinegraphiql`}>
      <div className={`${styles.buttons} buttons`}>
        <Button
          size="small"
          className={`${styles.button} ${styles.run} run-btn`}
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

      <GraphiQLInterface
        onEditQuery={onEditQuery}
        onEditVariables={onEditVariables}
        isHeadersEditorEnabled={false}
      />

      <Input
        elRef={curlRef}
        value={curl}
        readOnly={true}
        className={`${styles.curl} curl-input`}
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
  const { selectedToken } = useStorage();
  const { schema } = useSchema(selectedToken);
  const url = useGraphQLUrl(selectedToken);

  const { query: initialQuery, variables: initialVariabels } = props;

  const [show, setShow] = useState(false);
  const [query, setQuery] = useState(initialQuery);
  const [variables, setVariables] = useState(initialVariabels);

  useEffect(() => {
    setShow(false);
  }, [selectedToken]);

  if (!show || !schema) {
    return <DummyContainer inView={() => setShow(true)} show={true} />;
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

  return (
    <GraphiQLProvider
      fetcher={fetcher}
      schema={schema}
      query={initialQuery}
      storage={noStorage}
      variables={initialVariabels ? JSON.stringify(initialVariabels) : ""}
    >
      <InlineGraphiQL
        query={query}
        variables={variables}
        onEditVariables={setVariables}
        onEditQuery={setQuery}
      />
    </GraphiQLProvider>
  );
}
