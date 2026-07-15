import Button from "@/components/base/button";

import styles from "./ClientConnectButton.module.css";

export default function ClientConnectButton({
  onClick,
  hasActiveClientSummary,
  hasMissingClientConfiguration,
  resolvedDisplayName,
  alternativeDisplayName,
}) {
  return (
    <Button className={styles.button} onClick={onClick} secondary>
      <span className={styles.inner}>
        {hasActiveClientSummary ? (
          <span className={styles.status}>
            <span
              className={`${styles.indicator} ${
                hasMissingClientConfiguration
                  ? styles.warning
                  : styles.confirmed
              }`}
              aria-hidden="true"
            >
              {hasMissingClientConfiguration ? "⚠️" : "✅"}
            </span>
            <span className={styles.statusText}>
              <span className={styles.name} title={resolvedDisplayName}>
                {resolvedDisplayName}
              </span>
              {alternativeDisplayName && (
                <span
                  className={styles.alternative}
                  title={alternativeDisplayName}
                >
                  {alternativeDisplayName}
                </span>
              )}
            </span>
          </span>
        ) : (
          <span className={styles.label}>Here!</span>
        )}
      </span>
    </Button>
  );
}
