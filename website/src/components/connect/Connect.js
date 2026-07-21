import ConnectFeedback from "./connect-feedback";
import ConnectField from "./connect-field";
import ConnectSteps from "./connect-steps";
import styles from "./Connect.module.css";

import useConnectController from "@/hooks/controllers/useConnectController";

export default function Connect(props) {
  const {
    id,
    className = "",
    containerRef,
    inputRef,
    credentialValue,
    secretValue,
    hasFocus,
    pendingClient,
    resolvedDisplayName,
    isLoading,
    showLoadingSpinner,
    isResolvingCredential,
    hasResolvedDisplay,
    hasMissingConfigurationWarning,
    hasResolvedClientSecret,
    hasCompletedClientIdStep,
    showSteps,
    feedbackMessage,
    activeCheckMessage,
    showFeedbackOverlay,
    showPendingClientMessage,
    showReadyMessage,
    handleFormSubmit,
    handleFormFocusCapture,
    handleFormBlurCapture,
    focusActiveInput,
    handleClear,
    handleClearPointerDown,
    handleCredentialChange,
    handleCredentialPaste,
    handleSecretChange,
    handleSecretPaste,
  } = useConnectController(props);

  return (
    <form
      ref={containerRef}
      id={`${id}-form`}
      onFocusCapture={handleFormFocusCapture}
      onBlurCapture={handleFormBlurCapture}
      className={`${styles.form} ${showSteps ? styles.formWithSteps : ""} ${className}`}
      onSubmit={handleFormSubmit}
    >
      <ConnectSteps
        showSteps={showSteps}
        hasCompletedClientIdStep={hasCompletedClientIdStep}
        hasResolvedClientSecret={hasResolvedClientSecret}
      />

      <ConnectField
        id={id}
        inputRef={inputRef}
        credentialValue={credentialValue}
        secretValue={secretValue}
        hasFocus={hasFocus}
        pendingClient={pendingClient}
        displayName={resolvedDisplayName}
        hasResolvedDisplay={hasResolvedDisplay}
        hasMissingConfigurationWarning={hasMissingConfigurationWarning}
        isResolvingCredential={isResolvingCredential}
        isLoading={isLoading}
        showLoadingSpinner={showLoadingSpinner}
        onWrapPointerDown={focusActiveInput}
        onCredentialChange={handleCredentialChange}
        onCredentialPaste={handleCredentialPaste}
        onSecretChange={handleSecretChange}
        onSecretPaste={handleSecretPaste}
        onClear={handleClear}
        onClearPointerDown={handleClearPointerDown}
      />

      <ConnectFeedback
        containerRef={containerRef}
        activeCheckMessage={activeCheckMessage}
        showPendingClientMessage={showPendingClientMessage}
        showReadyMessage={showReadyMessage}
        showFeedbackOverlay={showFeedbackOverlay}
        feedbackMessage={feedbackMessage}
      />
    </form>
  );
}
