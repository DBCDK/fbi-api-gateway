import PropTypes from "prop-types";

import styles from "./Button.module.css";

function handleOnButtonClick() {
  alert("Button clicked!");
}

/**
 * The Component function
 *
 * @param {obj} props
 * See propTypes for specific props and types
 *
 * @returns {component}
 */
function Button({
  children = "im a button",
  className = "",
  type = "secondary",
  size = "medium",
  onClick = null,
  disabled = false,
  tabIndex = "0",
}) {
  const disabledStyle = disabled ? styles.disabled : "";

  return (
    <button
      className={`${styles.button} ${className} ${styles[size]} ${styles[type]} ${disabledStyle}`}
      onClick={(e) => (onClick ? onClick(e) : handleOnButtonClick(e))}
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
  type: PropTypes.oneOf(["primary", "secondary"]),
  size: PropTypes.oneOf(["large", "medium", "small"]),
  disabled: PropTypes.bool,
  skeleton: PropTypes.bool,
  onClick: PropTypes.func,
};
