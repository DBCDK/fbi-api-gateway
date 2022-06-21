import { useEffect, useState, useRef } from "react";

import Overlay from "@/components/base/overlay";

import useStorage from "@/hooks/useStorage";
import useConfiguration from "@/hooks/useConfiguration";

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
  const { configuration } = useConfiguration(selectedToken);
  // console.log({ selectedToken });
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
  const isAuthenticated = !!configuration?.uniqueId;

  const hasDisplay = !!(configuration?.displayName && hasValue && isToken);
 
  const emptyConfiguration = Object.keys(configuration || {}).length === 0;
  const _errorToken = !selectedToken?.token && "😬 This is not a valid token!";
  const _errorMissingConfig = selectedToken?.token && !emptyConfiguration && !configuration?.agency && "😬 Missing client configuration!";
  const _errorNoConfig = selectedToken?.token && emptyConfiguration && "😬 Invalid or expired token!"

  const hasError = _errorToken || _errorMissingConfig || _errorNoConfig;

  // custom class'
  const compactSize = compact ? styles.compact : "";
  const focusState = hasFocus ? styles.active : styles.inActive;
  const valueState = hasValue ? styles.value : styles.empty;
  const displayState = hasDisplay ? styles.display : "";

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
        className={`${styles.wrap} ${valueState} ${displayState} ${focusState}`}
      >
        {hasDisplay && (
          <div className={styles.display}>
            <Text type="text4" title={`${configuration?.displayName}`}>
              {isAuthenticated && <i title="Authenticated token">🧑</i>}{" "}
              {`${configuration?.displayName}`}
            </Text>
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
        <Text type="text2">{_errorToken || _errorMissingConfig || _errorNoConfig}</Text>
      </Overlay>
    </form>
  );
}
