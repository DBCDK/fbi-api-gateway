/**
 * @file Form for attaching a clientSecret to a client application entry and
 * resolving a fresh token from the server-side credential flow.
 */
import Text from "@/components/base/text";
import Button from "@/components/base/button";

import styles from "./ItemClientSecretForm.module.css";

export default function ItemClientSecretForm({
  clientSecret = "",
  clientSecretError = "",
  setClientSecret,
  onEnter = null,
  inputId,
  showAction = true,
  inlineWarning = false,
  onSubmit = null,
  hideLabel = false,
  trailingAction = null,
}) {
  const input = (
    <input
      id={inputId}
      type="password"
      className={inlineWarning ? styles.warningInput : styles.fieldInput}
      value={clientSecret}
      placeholder="Some client secret ..."
      autoComplete="new-password"
      autoCapitalize="none"
      autoCorrect="off"
      spellCheck={false}
      onChange={(e) => setClientSecret(e.target.value)}
      onKeyDown={(e) => {
        if (e.key === "Enter" && onEnter) {
          e.preventDefault();
          onEnter();
        }
      }}
    />
  );

  return (
    <div className={styles.formBlock}>
      <div
        className={`${styles.clientId} ${
          inlineWarning ? styles.inlineWarning : ""
        }`}
      >
        {inlineWarning ? (
          <div className={styles.fieldRow}>
            {input}
            {trailingAction}
          </div>
        ) : (
          <>
            {!hideLabel && <Text type="text4">Client secret</Text>}
            <div className={styles.fieldRow}>
              {input}
              {trailingAction}
            </div>
          </>
        )}
      </div>
      {clientSecretError && (
        <div
          className={`${styles.feedback} ${
            inlineWarning ? styles.feedbackInline : ""
          }`}
        >
          <Text type="text0" className={styles.error}>
            {clientSecretError}
          </Text>
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
