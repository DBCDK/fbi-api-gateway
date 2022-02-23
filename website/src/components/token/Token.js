import { useEffect, useState, useRef } from "react";

import useToken from "@/hooks/useToken";

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
  const {
    token,
    isValidating,
    setToken,
    removeToken,
    configuration,
  } = useToken();

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
      value: token || "",
      display: configuration?.displayName || false,
    });

    // upddate callback with new value
    token && onChange?.(token);
  }, [token]);

  // ref
  const inputRef = useRef(null);

  // states
  const hasFocus = !!state.focus;
  const hasValue = !!(state.value && state.value !== "");
  const isToken = state.value === token;

  const hasDisplay = !!(state.display && hasValue && (isToken || isValidating));

  // custom class'
  const compactSize = compact ? styles.compact : "";
  const focusState = hasFocus ? styles.active : styles.inActive;
  const valueState = hasValue ? styles.value : styles.empty;
  const displayState = hasDisplay ? styles.display : "";

  return (
    <form
      id={id}
      onClick={() => {
        inputRef?.current?.focus();
        state.value && hasDisplay && inputRef?.current?.select();
        setState({ ...state, focus: true });
      }}
      className={`${styles.form} ${compactSize} ${className}`}
      onSubmit={(e) => {
        e.preventDefault();
        // state.value && setToken(state.value);
        // onSubmit?.(state.value);
        inputRef?.current?.blur();
      }}
    >
      <div
        className={`${styles.wrap} ${valueState} ${displayState} ${focusState}`}
      >
        {hasDisplay && (
          <Text type="text5" className={styles.display}>
            {state.display}
          </Text>
        )}
        <input
          aria-label="inputfield for access token"
          ref={inputRef}
          id="token-input"
          className={styles.input}
          value={state.value}
          placeholder="Drop token here ..."
          // autoComplete="off"
          onBlur={() => {
            // state.value && setToken(state.value);
            // onSubmit?.(state.value);
            setState({ ...state, focus: false });
          }}
          onChange={(e) => {
            const value = e.target.value;
            value && setToken(value);
            onChange?.(value);
            setState({ ...state, value });
          }}
        />

        <Button
          className={styles.clear}
          onClick={(e) => {
            // Prevent firering onClick event on form
            e.stopPropagation();
            removeToken();
            setState({
              value: "",
              display: false,
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
    </form>
  );
}
