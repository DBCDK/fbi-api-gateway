import React, { useMemo } from "react";

import dynamic from "next/dynamic";
import styles from "./Voyager.module.css";
import useSchema from "@/hooks/useSchema";
import useSelectedCredential from "@/hooks/credentials/useSelectedCredential";

// Voyager cannot be imported server side
const VoyagerComp = dynamic(
  () => import("graphql-voyager").then((module) => module.Voyager),
  { ssr: false }
);

export default function Voyager() {
  const { selectedCredential: selectedToken } = useSelectedCredential();
  const { json } = useSchema(selectedToken);

  // Render only when token is changed,
  // else it will make intronspection query for each rerender
  const voyagerRendered = useMemo(
    () =>
      json ? (
        <VoyagerComp
          introspection={json}
          displayOptions={{ skipRelay: false, showLeafFields: true }}
        />
      ) : null,
    [json]
  );

  return <div className={styles.wrapper}>{voyagerRendered}</div>;
}
