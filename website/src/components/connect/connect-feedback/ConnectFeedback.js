import Overlay from "@/components/base/overlay";
import Text from "@/components/base/text";

import styles from "./ConnectFeedback.module.css";

export default function ConnectFeedback({
  containerRef,
  activeCheckMessage,
  showPendingClientMessage,
  showReadyMessage,
  showFeedbackOverlay,
  feedbackMessage,
}) {
  const shouldShowPendingClientMessage =
    !activeCheckMessage && showPendingClientMessage;
  const shouldShowReadyMessage = !activeCheckMessage && showReadyMessage;

  return (
    <>
      {activeCheckMessage && (
        <Text type="text0" className={styles.supportText}>
          {activeCheckMessage}
        </Text>
      )}

      {shouldShowPendingClientMessage && (
        <Text type="text0" className={styles.supportText}>
          🎉 Almost there! Please provide the client secret!
        </Text>
      )}

      {shouldShowReadyMessage && (
        <Text type="text0" className={styles.supportText}>
          You&apos;re good to go 😎
        </Text>
      )}

      <Overlay
        className={styles.overlay}
        show={showFeedbackOverlay}
        container={containerRef}
      >
        <Text type="text2">{feedbackMessage}</Text>
      </Overlay>
    </>
  );
}
