import Text from "@/components/base/text";
import Overlay from "@/components/base/overlay";

import { ToolbarButton } from "@graphiql/react";

import styles from "./Curl.module.css";
import { useRef, useState } from "react";

export default function CurlButton({ className, onClick }) {
  const [showCopy, setShowCopy] = useState(false);
  const elRef = useRef();

  return (
    <span ref={elRef} className={`${styles.curl} ${className}`}>
      <ToolbarButton
        className={styles.button}
        onClick={() => {
          onClick();
          setShowCopy(true);
          setTimeout(() => setShowCopy(false), 2000);
        }}
        label="Copy request as curl"
      >
        <Text type="text1">curl</Text>
      </ToolbarButton>
      <Overlay show={navigator?.clipboard && showCopy} container={elRef}>
        <Text type="text1">Copied to clipboard 📋</Text>
      </Overlay>
    </span>
  );
}
