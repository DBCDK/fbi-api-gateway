import Text from "@/components/base/text";

import styles from "./ConnectSteps.module.css";

export default function ConnectSteps({
  showSteps,
  hasCompletedClientIdStep,
  hasResolvedClientSecret,
}) {
  return (
    <div
      className={`${styles.steps} ${showSteps ? styles.stepsVisible : ""}`}
      aria-label="client connection steps"
      aria-hidden={!showSteps}
    >
      <Text type="text1" className={styles.step}>
        <span className={styles.stepIcon} aria-hidden="true">
          {hasCompletedClientIdStep ? "✅" : "⚫"}
        </span>
        client id
      </Text>
      <Text type="text1" className={styles.step}>
        <span className={styles.stepIcon} aria-hidden="true">
          {hasResolvedClientSecret ? "✅" : "⚫"}
        </span>
        client secret
      </Text>
    </div>
  );
}
