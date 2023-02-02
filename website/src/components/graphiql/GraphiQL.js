import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import {
  GraphiQL as _GraphiQL,
  GraphiQLInterface,
  // GraphiQLProvider,
} from "graphiql";
import {
  GraphiQLProvider,
  useExecutionContext,
  useEditorContext,
  usePrettifyEditors,
} from "@graphiql/react";

import "graphiql/graphiql.min.css";

import useStorage from "@/hooks/useStorage";
import useSchema, { useGraphQLUrl } from "@/hooks/useSchema";

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
      if (tab.query) {
        // prettifyEditors();
        // run();
      }
    }
  }, [tabs[activeTabIndex]]);

  // useEffect(() => {
  //   onTabChange(tabs[activeTabIndex]);
  // }, [activeTabIndex]);

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
  const [show, setShow] = useState(false);

  useEffect(() => {
    setShow(true);
  }, []);

  if (!show) {
    return null;
  }

  return (
    <_GraphiQL
      fetcher={async (graphQLParams) => {
        const data = await fetch(
          "https://swapi-graphql.netlify.app/.netlify/functions/index",
          {
            method: "POST",
            headers: {
              Accept: "application/json",
              "Content-Type": "application/json",
            },
            body: JSON.stringify(graphQLParams),
            credentials: "same-origin",
          }
        );
        return data.json().catch(() => data.text());
      }}
    />
  );
}

// if (typeof window === "undefined") {
//   return null;
// }

// const { selectedToken } = useStorage();
// const { schema } = useSchema(selectedToken);

// const url = useGraphQLUrl(selectedToken);

// const router = useRouter();
// const parameters = { ...router.query };

// const fetcher = async (graphQLParams) => {
//   const data = await fetch(url, {
//     method: "POST",
//     headers: {
//       Accept: "application/json",
//       "Content-Type": "application/json",
//       Authorization: `bearer ${selectedToken?.token}`,
//     },
//     body: JSON.stringify(graphQLParams),
//     credentials: "same-origin",
//   });

//   return data.json().catch(() => data.text());
// };

// function onEditQuery(newQuery) {
//   parameters.query = newQuery;
//   updateURL();
// }

// function onEditVariables(newVariables) {
//   parameters.variables = newVariables;
//   updateURL();
// }

// function onEditOperationName(newOperationName) {
//   parameters.operationName = newOperationName;
//   updateURL();
// }

// function onTabChange(state) {
//   const { query, variables, operationName } = state;

//   const params = {};

//   if (query) {
//     params.query = query;
//   }
//   if (variables) {
//     params.variables = variables;
//   }
//   if (operationName) {
//     params.operationName = operationName;
//   }

//   console.log("xxx onTabChange updateUrl", { ...parameters, ...params });

//   // updateURL({ ...parameters, ...params });
// }

// function updateURL() {
//   console.log("xxx update url", parameters);

//   router.replace({ query: parameters });

//   // setTimeout(() => router.replace({ query: parameters }), 200);
// }

// return (
//   <GraphiQLProvider
//     fetcher={fetcher}
//     schema={schema}
//     schemaDescription={true}
//     query={parameters.query}
//     variables={parameters.variables}
//     storage={noStorage}
//     operationName={parameters.operationName}
//     onEditOperationName={onEditOperationName}
//   >
//     <GraphiQL
//       onEditQuery={onEditQuery}
//       onEditVariables={onEditVariables}
//       onTabChange={onTabChange}
//     />
//   </GraphiQLProvider>
// );
