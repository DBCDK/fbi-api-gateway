import { useMemo } from "react";
import { printSchema } from "../schema/printer";
import { buildSchema } from "graphql";

import Convert from "ansi-to-html";

import AnsiHTML from "ansi-html";

const convert = new Convert();

import styles from "./Diff.module.css";

export default function Diff({ children }) {
  const schemaHtml = useMemo(() => {
    if (typeof children === "string") {
      return children.replaceAll("\n", "<br />");
    }
  }, [children]);

  console.log(schemaHtml);

  return (
    <div
      className={styles.container}
      dangerouslySetInnerHTML={{
        // __html: convert.toHtml(schemaHtml),
        __html: AnsiHTML(schemaHtml),
      }}
    />
  );
}
