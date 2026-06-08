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
  showResolvingMarker,
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
  const displayState =
    hasResolvedDisplay || pendingClient ? styles.displayState : "";
  const resolvedDisplayState = hasResolvedDisplay ? styles.resolvedDisplay : "";
  const focusedState = hasFocus ? styles.focused : "";
  const pendingState = pendingClient ? styles.pending : "";
  const hasSecretValueState =
    pendingClient && secretValue.trim() ? styles.hasSecretValue : "";
  const resolvingState = isResolvingCredential ? styles.resolving : "";

  return (
    <div
      className={`${styles.wrap} ${valueState} ${displayState} ${resolvedDisplayState} ${focusedState} ${pendingState} ${hasSecretValueState} ${resolvingState}`}
      onPointerDown={onWrapPointerDown}
    >
      <ConnectDisplay
        className={styles.fieldDisplay}
        pendingClient={pendingClient}
        hasResolvedDisplay={hasResolvedDisplay}
        hasFocus={hasFocus}
        displayName={displayName}
        hasMissingConfigurationWarning={hasMissingConfigurationWarning}
      />

      {showResolvingMarker && (
        <div className={styles.resolvingMarker} aria-hidden="true">
          <span className={styles.confirmed}>
            <Spinner animation="border" size="sm" />
          </span>
        </div>
      )}

      {isLoading && !isResolvingCredential && (
        <div className={styles.spinner}>
          <Spinner animation="border" size="sm" />
        </div>
      )}

      {pendingClient ? (
        <div className={styles.secretField}>
          <div className={styles.secretIcon} aria-hidden="true">
            {isResolvingCredential ? (
              <Spinner animation="border" size="sm" />
            ) : (
              "🤫"
            )}
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
            disabled={isResolvingCredential}
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
          disabled={isResolvingCredential}
          onChange={onCredentialChange}
          onPaste={onCredentialPaste}
        />
      )}

      <Button
        className={styles.clear}
        disabled={isResolvingCredential}
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
