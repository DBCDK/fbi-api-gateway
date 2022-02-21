import React, { useMemo } from "react";
import useToken from "@/hooks/useToken";
import dynamic from "next/dynamic";
import styles from "./Voyager.module.css";

// Voyager cannot be imported server side
const VoyagerComp = dynamic(
  () => import("graphql-voyager").then((module) => module.Voyager),
  { ssr: false }
);

export default function Voyager() {
  const { token } = useToken();
  function introspectionProvider(query) {
    return fetch(window.location.origin + "/graphql", {
      method: "post",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ query: query }),
    }).then((response) => response.json());
  }

  // Render only when token is changed,
  // else it will make intronspection query for each rerender
  const voyagerRendered = useMemo(
    () =>
      token ? (
        <VoyagerComp
          introspection={introspectionProvider}
        />
      ) : null,
    [token]
  );

  return <div className={styles.wrapper}>{voyagerRendered}</div>;
}
