import PropTypes from "prop-types";

import styles from "./Button.module.css";

/**
 * The Component function
 *
 * @param {obj} props
 * See propTypes for specific props and types
 *
 * @returns {component}
 */
function Button({
  type = "button",
  children = "im a button",
  className = "",
  size = "medium",
  onClick = null,
  disabled = false,
  tabIndex = "0",
  // primary = true,
  secondary = false,
  ...props
}) {
  const disabledStyle = disabled ? styles.disabled : "";

  const style = secondary ? "secondary" : "primary";

  return (
    <button
      {...props}
      type={type}
      className={`${styles.button} ${styles[size]} ${styles[style]} ${className} ${disabledStyle}`}
      onClick={(e) => onClick && onClick(e)}
      aria-disabled={disabled}
      disabled={disabled}
      tabIndex={tabIndex}
    >
      {children}
    </button>
  );
}

/**
 *  Default export function of the Component
 *
 * @param {obj} props
 * See propTypes for specific props and types
 *
 * @returns {component}
 */
export default function Container(props) {
  return <Button {...props} />;
}

// PropTypes for component
Container.propTypes = {
  children: PropTypes.any,
  className: PropTypes.oneOfType([PropTypes.string, PropTypes.object]),
  primary: PropTypes.bool,
  secondary: PropTypes.bool,
  size: PropTypes.oneOf(["large", "medium", "small"]),
  disabled: PropTypes.bool,
  onClick: PropTypes.func,
};
