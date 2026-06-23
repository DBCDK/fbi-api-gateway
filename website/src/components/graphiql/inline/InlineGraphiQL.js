import { useEffect, useRef, useState } from "react";
import { GraphiQLInterface } from "graphiql";

import {
  GraphiQLProvider,
  useExecutionContext,
  useEditorContext,
  usePrettifyEditors,
} from "@graphiql/react";

import { generateCurl } from "@/components/utils";

import useSchema, { useGraphQLUrl } from "@/hooks/useSchema";
import useIntersection from "@/hooks/useIntersection";
import useEffectiveSelectedCredential from "@/hooks/credentials/useEffectiveSelectedCredential";

import Text from "@/components/base/text";
import Button from "@/components/base/button";
import Input from "@/components/base/input";

import ComplexityButton from "../buttons/complexity";

import Overlay from "@/components/base/overlay";

import DepthButton from "../buttons/depth/Depth";
import useExecute from "@/hooks/useExecute";

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
function DummyContainer({ inView }) {
  //  force update for intersection observer (else ref will be undefined)
  const [_, setReady] = useState(false);

  const dummyContainerRef = useRef(null);
  const dummyContainerInView = useIntersection(
    dummyContainerRef.current,
    "0px"
  );

  useEffect(() => {
    setReady(true);
  }, []);

  useEffect(() => {
    if (dummyContainerInView) {
      inView?.(true);
    }
  }, [dummyContainerInView]);

  return (
    <div
      className={`${styles.inlinegraphiql} inlinegraphiql ${styles.dummy} dummy`}
      ref={dummyContainerRef}
    >
      <div className={`${styles.buttons} buttons`}>
        <Button
          size="small"
          className={`${styles.button} ${styles.run} run-btn`}
        >
          Run 🏃
        </Button>
        <Button
          secondary
          size="small"
          className={`${styles.button} ${styles.prettify}`}
        >
          Prettify ✨
        </Button>
        <Button
          secondary
          size="small"
          className={`${styles.button} ${styles.open}`}
        >
          Open in GraphiQL 🛰️
        </Button>
      </div>
      <div className={`${styles.interface} interface`} />
      <Input value={""} className={`${styles.curl} curl-input`} />
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
  token,
  onEditQuery,
  onEditVariables,
  settings,
  toolbar,
}) {
  const { tabs, activeTabIndex, initialQuery } = useEditorContext({
    nonNull: true,
  });

  const { run, isFetching } = useExecutionContext({
    nonNull: true,
  });

  const { execute } = settings;

  const prettifyEditors = usePrettifyEditors();

  const url = useGraphQLUrl();

  const [isReady, setIsReady] = useState(false);

  const curlRef = useRef();
  const [showCopy, setShowCopy] = useState(false);

  const curl = generateCurl({
    url,
    token,
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
      // Auto prettify when graphiql is first loaded
      if (initialQuery === tab.query) {
        try {
          prettifyEditors();
        } catch (err) {}
      }

      if (!tab.response && tab.query && !isFetching) {
        if (execute === "auto") {
          try {
            run();
          } catch (err) {}
        }
      }
    }
  }, [initialQuery, execute, tab, isReady]);

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
        toolbar={toolbar}
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
  const { effectiveCredential, effectiveToken } = useEffectiveSelectedCredential();
  const { schema } = useSchema(effectiveCredential);
  const { execute } = useExecute();
  const url = useGraphQLUrl();

  const { query: initialQuery, variables: initialVariabels = "" } = props;

  const [show, setShow] = useState(false);
  const [query, setQuery] = useState(initialQuery);
  const [variables, setVariables] = useState(initialVariabels);

  if (!show || !schema) {
    return <DummyContainer inView={() => setShow(true)} />;
  }

  const fetcher = async ({ query, variables = {} }) => {
    const data = await fetch(url, {
      method: "POST",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
        Authorization: `bearer ${effectiveToken}`,
        "X-Tracking-Consent": "false",
        "X-Session-Token": "test-session-id",
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
        token={effectiveToken}
        variables={variables}
        onEditVariables={setVariables}
        onEditQuery={setQuery}
        settings={{ execute }}
        toolbar={{
          additionalContent: [
            <DepthButton
              className={styles.depth}
              query={query}
              key="depth-btn"
            />,
            <ComplexityButton
              className={styles.complexity}
              variables={variables}
              query={query}
              key="complexity-btn"
            />,
          ],
        }}
      />
    </GraphiQLProvider>
  );
}
