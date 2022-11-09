import { useState } from "react";
import useStorage from "@/hooks/useStorage";

import { isToken } from "@/components/utils";

import Modal, { Pages } from "@/components/modal";

import Button from "@/components/base/button";

import styles from "./History.module.css";

export function History({ onClick, compact, disabled, className = "" }) {
  const [show, setShow] = useState(false);
  const compactClass = compact ? styles.compact : "";

  return (
    <>
      <Button
        className={`${styles.history} ${compactClass} ${className}`}
        disabled={disabled}
        onClick={() => setShow(true)}
        secondary
      >
        {/* <span>✏️</span> */}
        <span>🔐</span>
        {/* <span>⚙️</span> */}
        {/* <span>🗝️</span> */}
      </Button>
      <Modal
        show={show}
        onHide={() => setShow(false)}
        title="Your configurations"
        className={styles.modal}
      >
        <Pages.History modal={{ isVisible: show }} />
      </Modal>
    </>
  );
}

export default function Wrap(props) {
  const { history } = useStorage();
  const hasValidTokens = !!history?.filter((obj) => isToken(obj.token)).length;

  return (
    <History
      {...props}
      // disabled={!hasValidTokens}
    />
  );
}
