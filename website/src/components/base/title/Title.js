import PropTypes from "prop-types";

import styles from "./Title.module.css";

/**
 * The Component function
 *
 * @param {obj} props
 * See propTypes for specific props and types
 *
 * @returns {component}
 */
export const Title = ({
  children = "im a title",
  className = "",
  as = "h1",
  type = "title4",
  ...props
}) => {
  const As = as;

  return (
    <As className={`${styles.title} ${styles[type]} ${className}`} {...props}>
      {children}
    </As>
  );
};

/**
 *  Default export function of the Component
 *
 * @param {obj} props
 * See propTypes for specific props and types
 *
 * @returns {component}
 */
export default function Container(props) {
  return <Title {...props} />;
}

// PropTypes for the component
Container.propTypes = {
  children: PropTypes.oneOfType([
    PropTypes.string,
    PropTypes.object,
    PropTypes.arrayOf(PropTypes.node),
    PropTypes.node,
  ]),
  className: PropTypes.oneOfType([PropTypes.string, PropTypes.object]),
  tag: PropTypes.oneOf(["h1", "h2", "h3", "h4", "h5", "h6"]),
  type: PropTypes.oneOf([
    "title1",
    "title2",
    "title3",
    "title4",
    "title5",
    "title6",
  ]),
};
