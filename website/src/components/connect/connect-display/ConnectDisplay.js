import Text from "@/components/base/text";

import styles from "./ConnectDisplay.module.css";

function maskClientId(value, visible = 40) {
  if (!value || typeof value !== "string") {
    return "";
  }

  return value.slice(0, visible);
}

export default function ConnectDisplay({
  className = "",
  pendingClient,
  hasResolvedDisplay,
  displayName,
  hasMissingConfigurationWarning,
}) {
  if (!hasResolvedDisplay && !pendingClient) {
    return null;
  }

  return (
    <div className={`${styles.display} ${className}`}>
      {pendingClient ? (
        <Text type="text4" title={pendingClient.clientId || ""}>
          <span className={styles.confirmed} aria-hidden="true">
            ✅
          </span>{" "}
          {maskClientId(pendingClient.clientId, 40)}
        </Text>
      ) : (
        <Text type="text4" className={styles.resolvedLabel} title={displayName}>
          <span className={styles.confirmed} aria-hidden="true">
            ✅
          </span>{" "}
          {`${displayName} ${hasMissingConfigurationWarning ? "⚠️" : ""}`}
        </Text>
      )}
    </div>
  );
}
