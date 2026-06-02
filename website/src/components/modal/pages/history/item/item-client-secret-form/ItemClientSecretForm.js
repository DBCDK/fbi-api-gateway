/**
 * @file Form for attaching a clientSecret to a client history entry and
 * resolving a fresh token from the server-side credential flow.
 */
import Text from "@/components/base/text";
import Button from "@/components/base/button";

import styles from "./ItemClientSecretForm.module.css";

export default function ItemClientSecretForm({
  clientSecret = "",
  clientSecretError = "",
  setClientSecret,
  inputId,
  actionLabel = "Update & Use",
  showAction = true,
  inlineWarning = false,
  onSubmit = null,
}) {
  return (
    <>
      <div
        className={`${styles.clientId} ${
          inlineWarning ? styles.inlineWarning : ""
        }`}
      >
        {inlineWarning ? (
          <>
            <span className={styles.warningIcon} aria-hidden="true">
              ⚠️
            </span>
            <input
              id={inputId}
              type="password"
              className={styles.warningInput}
              value={clientSecret}
              placeholder="Enter clientSecret ..."
              onChange={(e) => setClientSecret(e.target.value)}
            />
          </>
        ) : (
          <>
            <Text type="text4">ClientSecret</Text>
            <div className={styles.fieldRow}>
              <span className={styles.fieldIcon} aria-hidden="true">
                🔑
              </span>
              <input
                id={inputId}
                type="password"
                className={styles.fieldInput}
                value={clientSecret}
                placeholder="Enter clientSecret ..."
                onChange={(e) => setClientSecret(e.target.value)}
              />
            </div>
          </>
        )}
      </div>
      {showAction && (
        <div className={styles.buttons}>
          <Button
            size="small"
            primary
            disabled={!clientSecret}
            onClick={onSubmit}
          >
            {actionLabel}
          </Button>
        </div>
      )}
      {clientSecretError && <Text type="text1">{clientSecretError}</Text>}
    </>
  );
}
