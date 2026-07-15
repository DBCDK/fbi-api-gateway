import { useEffect, useState, useRef } from "react";
import Spinner from "react-bootstrap/Spinner";

import Overlay from "@/components/base/overlay";

import useCredentialResolve from "@/hooks/credentials/useCredentialResolve";
import useCredentialEntries from "@/hooks/credentials/useCredentialEntries";
import useCredentialMutations from "@/hooks/credentials/useCredentialMutations";
import useResolvedConfiguration from "@/hooks/resolved/useResolvedConfiguration";
import useSelectedCredential from "@/hooks/credentials/useSelectedCredential";
import useUser from "@/hooks/useUser";
import { hasAvailableAgency } from "@/utils/configuration";
import { detectCredentialType } from "@/utils/credentials";

import Button from "@/components/base/button";
import Text from "@/components/base/text";

import styles from "./Token.module.css";

export default function Token({
  id,
  className = "",
  onSubmit,
  onChange,
  compact,
  onRequiresClientSecret,
  allowClientId = true,
}) {
  // useToken custom hook
  const { selectedCredential: selectedToken } = useSelectedCredential();
  const { selectCredential: setSelectedToken, clearSelectedCredential: removeSelectedToken } =
    useCredentialMutations();
  const { setCredentialEntry: setHistoryItem } = useCredentialEntries();
  const { resolveCredential } = useCredentialResolve();
  const { configuration, status, isLoading } =
    useResolvedConfiguration(selectedToken);
  const { user } = useUser(selectedToken);

  // internal state
  const [state, setState] = useState({
    value: "",
    display: false,
    focus: false,
  });
  const [resolveError, setResolveError] = useState("");

  // update token input value if changed after render (swr update)
  useEffect(() => {
    setState({
      ...state,
      value: selectedToken?.token || "",
    });

    // upddate callback with new value
    selectedToken?.token && onChange?.(selectedToken?.token);
  }, [selectedToken?.token]);

  // ref
  const inputRef = useRef(null);
  const containerRef = useRef(null);

  // states
  const hasFocus = !!state.focus;
  const hasValue = !!(state.value && state.value !== "");
  const isToken = state.value === selectedToken?.token;
  const isAuthenticated = user?.isAuthenticated;
  const hasCulrAccount = user?.hasCulrUniqueId;

  const hasDisplay = !!(configuration?.displayName && hasValue && isToken);
  const effectiveProfile =
    selectedToken?.profile ?? configuration?.profiles?.[0] ?? null;
  const hasValidationError =
    selectedToken?.token && !isLoading && status !== "OK";

  // Error messages
  const inputType = detectCredentialType(state.value);
  const acceptsCurrentInput =
    inputType === "token" || (allowClientId && inputType === "client");
  const _errorToken =
    !selectedToken?.token &&
    (state.value ? !acceptsCurrentInput : !inputType) &&
    `🧐 Input must be ${allowClientId ? "a token or a clientId" : "a token"}!`;

  const hasMissingConfigurationWarning =
    !isLoading &&
    !hasValidationError &&
    selectedToken?.token &&
    (!effectiveProfile || !hasAvailableAgency(configuration));

  const _errorExpired =
    hasValidationError && status === "EXPIRED" && "😔 This token is expired!";

  const _errorInvalid =
    hasValidationError && status === "INVALID" && "🧐 This token is invalid!";

  const _errorIsNotVerified =
    hasValidationError && status === "ERROR" && "🤔 Error validating token!";

  const hasError = _errorToken || hasValidationError || resolveError;

  async function handleResolveToken(nextValue = state.value, options = {}) {
    const { shouldSubmit = true } = options;

    if (!nextValue) {
      return;
    }

    const nextInputType = detectCredentialType(nextValue);
    const acceptsNextInput =
      nextInputType === "token" ||
      (allowClientId && nextInputType === "client");

    if (!acceptsNextInput) {
      setResolveError(
        `🧐 Input must be ${allowClientId ? "a valid token or clientId" : "a valid token"}!`
      );
      return;
    }

    setResolveError("");
    const response = await resolveCredential({
      value: nextValue,
    });

    if (response?.safeEntry?.status === "CLIENT_SECRET_REQUIRED") {
      setHistoryItem(response.safeEntry, false);
      removeSelectedToken();

      if (nextInputType === "client" && onRequiresClientSecret) {
        onRequiresClientSecret?.(response.safeEntry);
        return;
      }

      setResolveError(
        "Secret is required before token exchange. Open the application in the list to continue."
      );
      return;
    }

    if (!response?.safeEntry?.token) {
      setResolveError(
        response?.message || "🧐 Input must be a valid token or clientId!"
      );
      return;
    }

    setHistoryItem(response.safeEntry, false);
    setSelectedToken(
      response.safeEntry.token,
      response.safeEntry.profile,
      response.safeEntry.agency,
      {
        id: response.safeEntry.id,
        type: response.safeEntry.type,
        clientId: response.safeEntry.clientId,
        hasClientSecret: response.safeEntry.hasClientSecret,
      }
    );
    if (shouldSubmit) {
      onSubmit?.(response.safeEntry.token);
    }
    onChange?.(response.safeEntry.token);
  }

  // custom class'
  const compactSize = compact ? styles.compact : "";
  const focusState = hasFocus ? styles.active : styles.inActive;
  const valueState = hasValue ? styles.value : styles.empty;
  const displayState = hasDisplay ? styles.display : "";
  const loadingState = isLoading ? styles.isLoading : "";
  const activateInput = () => {
    inputRef?.current?.focus();
    state.value && hasDisplay && inputRef?.current?.select();
    setState({ ...state, focus: true });
  };

  return (
    <form
      ref={containerRef}
      id={`${id}-form`}
      onMouseDown={(e) => {
        const isInteractiveTarget =
          e.target instanceof HTMLElement &&
          e.target.closest("button, input");

        if (isInteractiveTarget) {
          return;
        }

        activateInput();
      }}
      className={`${styles.form} ${compactSize} ${className}`}
      onSubmit={async (e) => {
        e.preventDefault();
        await handleResolveToken();
        inputRef?.current?.blur();
      }}
    >
      <div
        className={`${styles.wrap} ${valueState} ${displayState} ${focusState} ${loadingState}`}
      >
        {hasDisplay && (
          <div className={styles.display}>
            <Text type="text4" title={`${configuration?.displayName}`}>
              {isAuthenticated && (
                <span
                  title={`Authenticated client access ${
                    !hasCulrAccount ? "- user does not exist in CULR" : ""
                  }`}
                >
                  🧑 {!hasCulrAccount && <i>⚠️</i>}
                </span>
              )}{" "}
              {`${configuration?.displayName} ${hasMissingConfigurationWarning ? "⚠️" : ""}`}
            </Text>
          </div>
        )}

        {isLoading && (
          <div className={styles.spinner}>
            <Spinner animation="border" size="sm" />
          </div>
        )}

        <input
          aria-label={`inputfield for access ${allowClientId ? "token or clientId" : "token"}`}
          ref={inputRef}
          id={id}
          className={styles.input}
          value={state.value}
          placeholder={
            allowClientId
              ? "Drop token or clientId here ..."
              : "Drop token here ..."
          }
          autoComplete="off"
          autoCapitalize="none"
          autoCorrect="off"
          spellCheck={false}
          onBlur={() => {
            setState({ ...state, focus: false });
          }}
          onChange={(e) => {
            const value = e.target.value;
            setResolveError("");
            onChange?.(value);
            setState({ ...state, value });
          }}
          onPaste={(e) => {
            const pastedValue = e.clipboardData?.getData("text")?.trim();

            if (detectCredentialType(pastedValue) !== "token") {
              return;
            }

            e.preventDefault();
            setResolveError("");
            onChange?.(pastedValue);
            setState((current) => ({
              ...current,
              value: pastedValue,
            }));
            window.setTimeout(() => {
              handleResolveToken(pastedValue, { shouldSubmit: false });
            }, 0);
          }}
        />
        <Button
          className={styles.clear}
          onMouseDown={(e) => {
            e.stopPropagation();
          }}
          onClick={(e) => {
            // Prevent firering onClick event on form
            e.stopPropagation();
            removeSelectedToken();
            setState({
              value: "",
              focus: false,
            });
            setTimeout(() => inputRef?.current?.focus(), 100);
          }}
          secondary
        >
          <Text>✖</Text>
          {/* 🗑️ */}
        </Button>
      </div>
      <Overlay
        className={`${styles.overlay} ${compact ? "compact" : ""}`}
        show={!state.focus && state.value && hasError}
        container={containerRef}
      >
        <Text type="text2">
          {_errorToken ||
            _errorExpired ||
            _errorInvalid ||
            _errorIsNotVerified ||
            resolveError}
        </Text>
      </Overlay>
    </form>
  );
}
