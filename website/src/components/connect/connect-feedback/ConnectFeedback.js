import Overlay from "@/components/base/overlay";
import Text from "@/components/base/text";

import styles from "./ConnectFeedback.module.css";

export default function ConnectFeedback({
  containerRef,
  showPendingClientMessage,
  showReadyMessage,
  showFeedbackOverlay,
  feedbackMessage,
}) {
  return (
    <>
      {showPendingClientMessage && (
        <Text type="text0" className={styles.supportText}>
          🎉 Almost there! Please provide the client secret!
        </Text>
      )}

      {showReadyMessage && (
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
