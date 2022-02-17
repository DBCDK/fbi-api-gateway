import { useEffect, useState, useRef } from "react";

import useToken from "@/hooks/useToken";

import Input from "@/components/base/input";
import Button from "@/components/base/button";
import Text from "@/components/base/text";

import styles from "./Token.module.css";

export default function Token({ id, onSubmit, onChange }) {
  // useToken custom hook
  const {
    token,
    isValidating,
    setToken,
    clearToken,
    configuration,
  } = useToken();

  // internal state
  const [state, setState] = useState({
    value: "",
    display: "",
    focus: false,
  });

  // update token input value if changed after render (swr update)
  useEffect(() => {
    if (token && !isValidating) {
      const display = configuration?.displayName;
      setState({
        ...state,
        value: token,
        valid: !!token,
        display: display ? `${display}: ${token}` : token,
      });
    }
  }, [isValidating]);

  // Make input switch between token and configuration: displayName
  useEffect(() => {
    if (token) {
      const display = configuration?.displayName;
      setState({
        ...state,
        display: !state.focus && display ? `${display}: ${token}` : token,
      });

      setTimeout(() => inputRef?.current?.focus(), 100);
    }
  }, [state.focus]);

  console.log("state", { state });

  // ref
  const inputRef = useRef(null);

  // states
  const hasFocus = !!state.focus;
  const hasValue = !!(state.value && state.value !== "");
  const isToken = state.value === token;

  // class'
  const focusState = hasFocus ? styles.active : styles.inActive;
  const valueState = hasValue ? styles.value : styles.empty;
  const lockState = hasValue && isToken ? styles.locked : "";

  return (
    <form
      id={id}
      onSubmit={(e) => {
        e.preventDefault();
        state.value && setToken(state.value);
        onSubmit?.(state.value);
      }}
    >
      <div
        className={`${styles.wrap} ${valueState} ${focusState} ${lockState}`}
      >
        <Input
          elRef={inputRef}
          id="token-input"
          className={styles.input}
          value={state.display}
          placeholder="Drop token here ..."
          readOnly={!hasFocus && hasValue && isToken}
          onDoubleClick={() => setState({ ...state, focus: true })}
          onBlur={() => setState({ ...state, focus: false })}
          onChange={(e) => {
            const value = e.target.value;
            onChange?.(value);
            setState({ ...state, value });
          }}
        />

        <Button
          className={styles.clear}
          onClick={() => {
            clearToken();
            setState({
              value: "",
              display: "",
              focus: false,
            });
            setTimeout(() => inputRef?.current?.focus(), 100);
          }}
          secondary
        >
          {/* <Text>✖</Text> */}
          🗑️
        </Button>
      </div>
    </form>
  );
}
