import PropTypes from "prop-types";

import styles from "./Label.module.css";

/**
 * The Component function
 *
 * @param {obj} props
 * See propTypes for specific props and types
 *
 * @returns {component}
 */
function Label({ children = "Some label", className = "", for: htmlFor = "" }) {
  return (
    <label htmlFor={htmlFor} className={`${styles.label} ${className}`}>
      {children}
    </label>
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
export default function Wrap(props) {
  return <Label {...props} />;
}

// PropTypes for the component
Wrap.propTypes = {
  for: PropTypes.string.isRequired,
  children: PropTypes.oneOfType([
    PropTypes.string,
    PropTypes.object,
    PropTypes.node,
  ]),
  className: PropTypes.oneOfType([PropTypes.string, PropTypes.object]),
};
