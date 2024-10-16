import Text from "@/components/base/text";
import Overlay from "@/components/base/overlay";

import { ToolbarButton } from "@graphiql/react";

import styles from "./Curl.module.css";
import { useRef, useState } from "react";
import { Dropdown, OverlayTrigger, Tooltip } from "react-bootstrap";

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
          // setTimeout(() => setShowCopy(false), 2000);
        }}
        label="Copy request as curl"
      >
        <Dropdown
          className={`${styles.wrap} ${className}`}
          align="end"
          drop="up-centered"
        >
          <Dropdown.Toggle className={styles.toggle} id="dropdown-mode-select">
            curl
          </Dropdown.Toggle>

          <Dropdown.Menu className={styles.menu}>
            <Dropdown.Item className={styles.item}>
              <ToolbarButton>add</ToolbarButton>
            </Dropdown.Item>
            <Dropdown.Item className={styles.item}>copy</Dropdown.Item>
          </Dropdown.Menu>
        </Dropdown>
      </ToolbarButton>
      <Overlay show={navigator?.clipboard && showCopy} container={elRef}>
        <Text type="text1">Copied to clipboard 📋</Text>
      </Overlay>
    </span>
  );
}
