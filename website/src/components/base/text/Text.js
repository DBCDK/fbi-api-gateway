import PropTypes from "prop-types";
import styles from "./Text.module.css";

/**
 * The Component function
 *
 * @param {obj} props
 * See propTypes for specific props and types
 *
 * @returns {component}
 */
function Text({
  children = "lorem ipsum dolor sit amet ...",
  className = "",
  type = "text2",
  style,
}) {
  return (
    <p className={`${styles.text} ${styles[type]} ${className}`} style={style}>
      {children}
    </p>
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
  return <Text {...props} />;
}

// PropTypes for the component
Container.propTypes = {
  children: PropTypes.oneOfType([
    PropTypes.string,
    PropTypes.array,
    PropTypes.object,
    PropTypes.arrayOf(PropTypes.node),
    PropTypes.node,
  ]),
  className: PropTypes.oneOfType([PropTypes.string, PropTypes.object]),
  type: PropTypes.oneOf(["text1", "text2", "text3", "text4", "text5", "text6"]),
};
