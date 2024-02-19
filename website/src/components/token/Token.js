import { useEffect, useState, useRef } from "react";
import Spinner from "react-bootstrap/Spinner";

import Overlay from "@/components/base/overlay";

import useStorage from "@/hooks/useStorage";
import useConfiguration from "@/hooks/useConfiguration";
import useUser from "@/hooks/useUser";

import Button from "@/components/base/button";
import Text from "@/components/base/text";

import styles from "./Token.module.css";

export default function Token({
  id,
  className = "",
  onSubmit,
  onChange,
  compact,
}) {
  // useToken custom hook
  const { selectedToken, setSelectedToken, removeSelectedToken } = useStorage();
  const { configuration, status, isLoading } = useConfiguration(selectedToken);
  const { user } = useUser(selectedToken);

  // internal state
  const [state, setState] = useState({
    value: "",
    display: false,
    focus: false,
  });

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

  const hasMissingConfigError =
    !selectedToken?.profile || !configuration?.agency;

  const hasValidationError =
    selectedToken?.token && !isLoading && status !== "OK";

  // Error messages
  const _errorToken = !selectedToken?.token && "🧐 This token is invalid!";

  const _errorMissingConfig =
    !isLoading &&
    !hasValidationError &&
    hasMissingConfigError &&
    "😵‍💫 Missing client configuration!";

  const _errorExpired =
    hasValidationError && status === "EXPIRED" && "😔 This token is expired!";

  const _errorInvalid =
    hasValidationError && status === "INVALID" && "🧐 This token is invalid!";

  const _errorIsNotVerified =
    hasValidationError && status === "ERROR" && "🤔 Error validating token!";

  const hasError = _errorToken || _errorMissingConfig || hasValidationError;

  // custom class'
  const compactSize = compact ? styles.compact : "";
  const focusState = hasFocus ? styles.active : styles.inActive;
  const valueState = hasValue ? styles.value : styles.empty;
  const displayState = hasDisplay ? styles.display : "";
  const loadingState = isLoading ? styles.isLoading : "";

  return (
    <form
      ref={containerRef}
      id={`${id}-form`}
      onClick={() => {
        inputRef?.current?.focus();
        state.value && hasDisplay && inputRef?.current?.select();
        setState({ ...state, focus: true });
      }}
      className={`${styles.form} ${compactSize} ${className}`}
      onSubmit={(e) => {
        e.preventDefault();
        onSubmit?.(state.value);
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
                  title={`Authenticated token ${
                    !hasCulrAccount ? "- user does not exist in CULR" : ""
                  }`}
                >
                  🧑 {!hasCulrAccount && <i>⚠️</i>}
                </span>
              )}{" "}
              {`${configuration?.displayName}`}
            </Text>
          </div>
        )}

        {isLoading && (
          <div className={styles.spinner}>
            <Spinner animation="border" size="sm" />
          </div>
        )}

        <input
          aria-label="inputfield for access token"
          ref={inputRef}
          id={id}
          className={styles.input}
          value={state.value}
          placeholder="Drop token here ..."
          autoComplete="off"
          onBlur={() => {
            // state.value && setToken(state.value);
            // onSubmit?.(state.value);
            setState({ ...state, focus: false });
          }}
          onChange={(e) => {
            const value = e.target.value;
            value && setSelectedToken(value, null);
            onChange?.(value);
            setState({ ...state, value });
          }}
        />
        <Button
          className={styles.clear}
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
            _errorMissingConfig ||
            _errorInvalid ||
            _errorIsNotVerified}
        </Text>
      </Overlay>
    </form>
  );
}
