import { useRef, useState } from "react";
import useStorage from "@/hooks/useStorage";
import useConfiguration from "@/hooks/useConfiguration";

import { isToken } from "@/components/utils";

import Modal, { Pages } from "@/components/modal";

import Button from "@/components/base/button";
import Overlay from "@/components/base/overlay";
import Text from "@/components/base/text";

import styles from "./History.module.css";

export function History({ onClick, compact, disabled, className = "" }) {
  const [show, setShow] = useState(false);
  const buttonRef = useRef(null);
  const { selectedToken } = useStorage();
  const { status, isLoading } = useConfiguration(selectedToken);
  const compactClass = compact ? styles.compact : "";

  const hasValidationError =
    selectedToken?.token && !isLoading && status !== "OK";

  return (
    <>
      <Button
        elRef={buttonRef}
        className={`${styles.history} ${compactClass} ${className}`}
        disabled={disabled}
        onClick={() => setShow(true)}
        secondary
      >
        <span>🔐</span>
      </Button>
      <Overlay
        className={styles.errorOverlay}
        show={Boolean(hasValidationError)}
        container={buttonRef}
        placement="bottom"
      >
        <Text type="text1">Validation Error 😵‍💫</Text>
      </Overlay>
      <Modal show={show} onHide={() => setShow(false)} className={styles.modal}>
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
