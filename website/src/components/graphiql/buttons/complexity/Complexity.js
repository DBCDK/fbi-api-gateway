import { useRef, useState } from "react";

import { ToolbarButton } from "@graphiql/react";

import Progress from "@/components/base/progress";
import Overlay from "@/components/base/overlay/Overlay";
import Text from "@/components/base/text";

import useComplexity from "@/hooks/useComplexity";

import styles from "./Complexity.module.css";
import useStorage from "@/hooks/useStorage";

export default function ComplexityButton({ className, query, variables }) {
  const { selectedToken } = useStorage();
  const { complexity, complexityClass, limit } = useComplexity({
    token: selectedToken?.token,
    query,
    variables,
  });

  const complexityRef = useRef();
  const [show, setShow] = useState(false);

  const type = complexityClass;

  const typeColorClass = type ? styles[`color-${type}`] : "";

  return (
    <span ref={complexityRef} className={`${styles.complexity} ${className}`}>
      <ToolbarButton
        className={styles.button}
        label="Query complexity"
        onClick={() => setShow(true)}
      >
        <Progress.Circle
          value={complexity}
          limit={limit}
          speed={1}
          states={{
            0: { color: "var(--success-dark)" },
            20: { color: "var(--warning-dark)" },
            100: { color: "var(--error)" },
          }}
        />
      </ToolbarButton>
      <Overlay
        show={show}
        container={complexityRef}
        placement={"right"}
        rootClose={true}
        onHide={() => setShow(false)}
        className={styles.complexityOverlay}
      >
        <div>
          <Text type="text1">
            {`Complexity: ${complexity} `}
            <span className={typeColorClass}>{type}</span>
          </Text>
        </div>
      </Overlay>
    </span>
  );
}
