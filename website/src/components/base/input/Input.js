import PropTypes from "prop-types";
import { useState, useEffect } from "react";

import styles from "./Input.module.css";

/**
 * The Component function
 *
 * @param {obj} props
 * See propTypes for specific props and types
 *
 * Get you value like <Input onChange={(e) => console.log(e.target.value)} ... />
 *
 * @returns {component}
 */

function Input({
  className,
  tabIndex = "0",
  type = "text",
  id,
  invalid,
  value = "",
  placeholder = null,
  disabled = false,
  onChange,
  onBlur,
  dataCy = "input",
  readOnly = false,
  elRef = null,
  required,
  "aria-labelledby": ariaLabelledby,
  "aria-label": ariaLabel,
  ...props
}) {
  const [val, setVal] = useState(value || "");

  // Update value if undefined/null at first render
  useEffect(() => {
    setVal(value);
  }, [value]);

  const readOnlyClass = readOnly || disabled ? styles.readOnly : "";
  const invalidClass = !readOnlyClass && invalid ? styles.error : "";

  console.log("input", { value, val });

  return (
    <input
      {...props}
      id={id}
      ref={elRef}
      className={`${styles.input} ${readOnlyClass} ${invalidClass} ${className}`}
      type={type}
      value={val}
      placeholder={placeholder}
      disabled={disabled}
      readOnly={readOnly}
      data-cy={dataCy}
      tabIndex={disabled ? "-1" : tabIndex}
      onBlur={(e) => onBlur && onBlur(e)}
      onChange={(e) => {
        onChange && onChange(e);
        setVal(e.target.value);
      }}
      required={required}
      aria-labelledby={ariaLabelledby}
      aria-label={ariaLabel}
    />
  );
}

// PropTypes for component
Input.propTypes = {
  id: PropTypes.string,
  elRef: PropTypes.object,
  type: PropTypes.string,
  tabIndex: PropTypes.string,
  className: PropTypes.string,
  value: PropTypes.string,
  invalid: PropTypes.bool,
  placeholder: PropTypes.string,
  disabled: PropTypes.bool,
  required: PropTypes.bool,
  readOnly: PropTypes.bool,
  onChange: PropTypes.func,
  onBlur: PropTypes.func,
  skeleton: PropTypes.bool,
  dataCy: PropTypes.string,
  "aria-labelledby": PropTypes.string,
  "aria-label": PropTypes.string,
};

/**
 * Return default wrap
 *
 */
export default function Wrap(props) {
  return <Input {...props} />;
}
