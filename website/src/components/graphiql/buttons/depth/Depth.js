import { useRef, useState } from "react";

import { parse } from "graphql";

import { ToolbarButton } from "@graphiql/react";

import useQueryDepth from "@/hooks/useQueryDepth";

import Progress from "@/components/base/progress";

import styles from "./Depth.module.css";
import Overlay from "@/components/base/overlay/Overlay";
import Text from "@/components/base/text";

export function getDepthClass(depth, maxDepth) {
  if (depth < maxDepth / 2) {
    return "simple";
  }
  if (depth < maxDepth) {
    return "complex";
  }

  return "rejected";
}

export default function DepthButton({ className = "", query }) {
  // Parse the query into an AST

  // Use the custom hook to get the query depth
  const { depth, maxDepth } = useQueryDepth(query);

  const elRef = useRef();
  const [show, setShow] = useState(false);

  const type = getDepthClass(depth, maxDepth);

  const typeColorClass = type ? styles[`color-${type}`] : "";

  return (
    <span ref={elRef} className={`${styles.depth} ${className}`}>
      <ToolbarButton
        className={styles.button}
        label="Query depth"
        onClick={() => setShow(true)}
      >
        <Progress.Circle
          value={depth}
          limit={maxDepth}
          speed={50}
          states={{
            0: { color: "var(--success-dark)" },
            60: { color: "var(--warning-dark)" },
            101: { color: "var(--error)" },
          }}
        />
      </ToolbarButton>
      <Overlay
        show={show}
        container={elRef}
        placement={"right"}
        rootClose={true}
        onHide={() => setShow(false)}
        className={styles.overlay}
      >
        <div>
          <Text type="text1">
            {"Query depth: "}
            <span className={typeColorClass}>{depth}</span>
          </Text>
        </div>
      </Overlay>
    </span>
  );
}
