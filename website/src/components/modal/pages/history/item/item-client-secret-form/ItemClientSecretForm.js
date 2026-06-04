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
  clientSecretStatus = "",
  setClientSecret,
  onEnter = null,
  inputId,
  showAction = true,
  inlineWarning = false,
  onSubmit = null,
  hideLabel = false,
}) {
  return (
    <div className={styles.formBlock}>
      <div
        className={`${styles.clientId} ${
          inlineWarning ? styles.inlineWarning : ""
        }`}
      >
        {inlineWarning ? (
          <>
            <span className={styles.warningIcon} aria-hidden="true">
              {/* ⚠️ */}
              🤫
            </span>
            <input
              id={inputId}
              type="password"
              className={styles.warningInput}
              value={clientSecret}
              placeholder="Some client secret ..."
              onChange={(e) => setClientSecret(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && onEnter) {
                  e.preventDefault();
                  onEnter();
                }
              }}
            />
          </>
        ) : (
          <>
            {!hideLabel && <Text type="text4">Client secret</Text>}
            <div className={styles.fieldRow}>
              <span className={styles.fieldIcon} aria-hidden="true">
                {/* 🔑 */}
                🤫
              </span>
              <input
                id={inputId}
                type="password"
                className={styles.fieldInput}
                value={clientSecret}
                placeholder="Some client secret ..."
                onChange={(e) => setClientSecret(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && onEnter) {
                    e.preventDefault();
                    onEnter();
                  }
                }}
              />
            </div>
          </>
        )}
      </div>
      {(clientSecretError || clientSecretStatus) && (
        <div
          className={`${styles.feedback} ${
            inlineWarning ? styles.feedbackInline : ""
          }`}
        >
          {clientSecretError && (
            <Text type="text1" className={styles.error}>
              {clientSecretError}
            </Text>
          )}
          {clientSecretStatus && (
            <Text type="text1" className={styles.status}>
              {clientSecretStatus}
            </Text>
          )}
        </div>
      )}
      {showAction && (
        <div className={styles.buttons}>
          <Button
            size="small"
            primary
            disabled={!clientSecret}
            onClick={onSubmit}
          >
            Update & Use
          </Button>
        </div>
      )}
    </div>
  );
}
