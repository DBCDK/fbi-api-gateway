/**
 * JSONText component
 *
 * Renders JSON data as syntax-highlighted, formatted HTML inside a span element.
 * Supports optional collapsing for compact display.
 */

import { useMemo } from "react";
import styles from "./JsonText.module.css";
import dynamic from "next/dynamic";

const ReactJsonView = dynamic(import("@microlink/react-json-view"), {
  ssr: false,
});

const syntaxHighlight = (json: string | Record<string, unknown>): string => {
  const jsonStr =
    typeof json === "string" ? json : JSON.stringify(json, null, 2);

  const escaped = jsonStr
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");

  return escaped.replace(
    /("(\\u[a-zA-Z0-9]{4}|\\[^u]|[^\\"])*"(\s*:)?|\b(true|false|null)\b|-?\d+(?:\.\d*)?(?:[eE][+\-]?\d+)?)/g,
    (match: string): string => {
      let cls = styles["json-number"];

      if (/^"/.test(match)) {
        cls = /:$/.test(match) ? styles["json-key"] : styles["json-string"];
      } else if (/true|false/.test(match)) {
        cls = styles["json-boolean"];
      } else if (/null/.test(match)) {
        cls = styles["json-null"];
      }

      return `<span class="${cls}">${match}</span>`;
    }
  );
};

export function JSONText({
  text,
  collapsed,
}: {
  text: string | Record<string, unknown>;
  collapsed?: boolean;
}) {
  const highlighted = useMemo(() => {
    return syntaxHighlight(text);
  }, [text]);

  if (collapsed) {
    return (
      <span
        className={`${styles["json-wrap"]} ${collapsed ? styles.collapsed : ""}`}
        dangerouslySetInnerHTML={{
          __html: highlighted,
        }}
      />
    );
  }

  return (
    <ReactJsonView
      src={text as object}
      enableClipboard={false}
      displayDataTypes={false}
      name={false}
    />
  );
}
