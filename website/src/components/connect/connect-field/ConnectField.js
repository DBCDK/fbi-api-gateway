import Spinner from "react-bootstrap/Spinner";

import Button from "@/components/base/button";
import Text from "@/components/base/text";

import ConnectDisplay from "../connect-display";
import styles from "./ConnectField.module.css";

export default function ConnectField({
  id,
  inputRef,
  credentialValue,
  secretValue,
  hasFocus,
  pendingClient,
  displayName,
  hasResolvedDisplay,
  hasMissingConfigurationWarning,
  isResolvingCredential,
  isLoading,
  showLoadingSpinner,
  onWrapPointerDown,
  onCredentialChange,
  onCredentialPaste,
  onSecretChange,
  onSecretPaste,
  onClear,
  onClearPointerDown,
}) {
  const valueState =
    credentialValue || secretValue || pendingClient || isResolvingCredential
      ? styles.value
      : styles.empty;
  const focusedState = hasFocus ? styles.focused : "";
  const pendingState = pendingClient ? styles.pending : "";
  const hasSecretValueState =
    pendingClient && secretValue.trim() ? styles.hasSecretValue : "";
  const fieldIsLoading = showLoadingSpinner;
  const displayState =
    (hasResolvedDisplay || pendingClient) && !fieldIsLoading
      ? styles.displayState
      : "";
  const resolvedDisplayState =
    hasResolvedDisplay && !fieldIsLoading ? styles.resolvedDisplay : "";
  const resolvingState = fieldIsLoading ? styles.resolving : "";

  return (
    <div
      className={`${styles.wrap} ${valueState} ${displayState} ${resolvedDisplayState} ${focusedState} ${pendingState} ${hasSecretValueState} ${resolvingState}`}
      onPointerDown={onWrapPointerDown}
    >
      {showLoadingSpinner && (
        <div className={styles.resolvingMarker} aria-hidden="true">
          <span className={styles.confirmed}>
            <Spinner animation="border" size="sm" />
          </span>
        </div>
      )}

      <ConnectDisplay
        className={styles.fieldDisplay}
        pendingClient={fieldIsLoading ? null : pendingClient}
        hasResolvedDisplay={hasResolvedDisplay && !fieldIsLoading}
        hasFocus={hasFocus}
        displayName={displayName}
        hasMissingConfigurationWarning={hasMissingConfigurationWarning}
      />

      {pendingClient ? (
        <div className={styles.secretField}>
          <div className={styles.secretIcon} aria-hidden="true">
            {"🤫"}
          </div>
          <input
            ref={inputRef}
            id={id}
            aria-label="inputfield for client secret"
            className={`${styles.input} ${styles.secretInput}`}
            type="password"
            value={secretValue}
            placeholder="Add client secret ..."
            autoComplete="off"
            disabled={fieldIsLoading}
            onChange={onSecretChange}
            onPaste={onSecretPaste}
          />
        </div>
      ) : (
        <input
          ref={inputRef}
          id={id}
          aria-label="inputfield for access token or clientId"
          className={styles.input}
          type="text"
          value={credentialValue}
          placeholder="Drop token or client id here ..."
          autoComplete="off"
          disabled={fieldIsLoading}
          onChange={onCredentialChange}
          onPaste={onCredentialPaste}
        />
      )}

      <Button
        className={styles.clear}
        disabled={fieldIsLoading}
        onPointerDown={onClearPointerDown}
        onMouseDown={onClearPointerDown}
        onClick={onClear}
        secondary
      >
        <Text>✖</Text>
      </Button>
    </div>
  );
}
