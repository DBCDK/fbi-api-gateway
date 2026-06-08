import { useRef, useState } from "react";
import useStorage from "@/hooks/useStorage";
import useConfiguration from "@/hooks/useConfiguration";

import { isToken } from "@/components/utils";

import Modal, { Pages } from "@/components/modal";

import Button from "@/components/base/button";
import Overlay from "@/components/base/overlay";
import Text from "@/components/base/text";

import styles from "./Applications.module.css";

export function Applications({
  onClick,
  compact,
  disabled,
  className = "",
  show: controlledShow,
  onShowChange,
  openAddOnShow = false,
}) {
  const [uncontrolledShow, setUncontrolledShow] = useState(false);
  const buttonRef = useRef(null);
  const { selectedToken } = useStorage();
  const { status, isLoading } = useConfiguration(selectedToken);
  const compactClass = compact ? styles.compact : "";
  const show = controlledShow ?? uncontrolledShow;

  const hasValidationError =
    selectedToken?.token && !isLoading && status !== "OK";

  function handleShowChange(nextShow) {
    onShowChange?.(nextShow);

    if (controlledShow === undefined) {
      setUncontrolledShow(nextShow);
    }
  }

  return (
    <>
      <Button
        elRef={buttonRef}
        className={`${styles.history} ${compactClass} ${className}`}
        disabled={disabled}
        onClick={() => handleShowChange(true)}
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
      <Modal
        show={show}
        onHide={() => handleShowChange(false)}
        className={styles.modal}
      >
        <Pages.Applications
          modal={{
            isVisible: show,
            openAddOnShow,
          }}
        />
      </Modal>
    </>
  );
}

export default function Wrap(props) {
  const { applications } = useStorage();
  const hasValidTokens = !!applications?.filter((obj) => isToken(obj.token)).length;

  return (
    <Applications
      {...props}
      // disabled={!hasValidTokens}
    />
  );
}
