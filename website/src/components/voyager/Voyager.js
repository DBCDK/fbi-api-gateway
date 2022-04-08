import React, { useMemo } from "react";

import useStorage from "@/hooks/useStorage";

import dynamic from "next/dynamic";
import styles from "./Voyager.module.css";
import { useGraphQLUrl } from "@/hooks/useSchema";

// Voyager cannot be imported server side
const VoyagerComp = dynamic(
  () => import("graphql-voyager").then((module) => module.Voyager),
  { ssr: false }
);

export default function Voyager() {
  const url = useGraphQLUrl();
  const { selectedToken } = useStorage();
  function introspectionProvider(query) {
    return fetch(url, {
      method: "post",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${selectedToken?.token}`,
      },
      body: JSON.stringify({ query: query }),
    }).then((response) => response.json());
  }

  // Render only when token is changed,
  // else it will make intronspection query for each rerender
  const voyagerRendered = useMemo(
    () =>
      selectedToken ? (
        <VoyagerComp introspection={introspectionProvider} />
      ) : null,
    [selectedToken]
  );

  return <div className={styles.wrapper}>{voyagerRendered}</div>;
}
