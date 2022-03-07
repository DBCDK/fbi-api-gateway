import styles from "./schema.module.css";
import { printSchema } from "./printer";
import { buildSchema } from "graphql";
import { useMemo } from "react";
export default function Schema({ children }) {
  const schemaHtml = useMemo(() => {
    if (typeof children === "string") {
      return printSchema(buildSchema(children));
    }
  }, [children]);
  return (
    <div
      className={styles.schema}
      dangerouslySetInnerHTML={{ __html: schemaHtml }}
    ></div>
  );
}
