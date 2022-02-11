import PropTypes from "prop-types";

import { cyKey } from "@/utils/trim";

import Text from "@/components/base/text";

import styles from "./Label.module.css";

/**
 * The Component function
 *
 * @param {obj} props
 * See propTypes for specific props and types
 *
 * @returns {component}
 */
function Label({
  children = "Some label",
  className = "",
  for: htmlFor = "",
  dataCy,
  ...props
}) {
  // generate data-cy key if none given
  const key = dataCy || cyKey({ name: children, prefix: "label" });

  return (
    <label
      htmlFor={htmlFor}
      className={`${styles.label} ${className}`}
      data-cy={key}
    >
      <Text type="text1" skeleton={props.skeleton} lines={props.lines}>
        {children}
      </Text>
    </label>
  );
}

/**
 * Function to return skeleton (Loading) version of the Component
 *
 * @param {obj} props
 *  See propTypes for specific props and types
 *
 * @returns {component}
 */
function LabelSkeleton(props) {
  return (
    <Label
      {...props}
      lines={1}
      className={`${props.className || ""} ${styles.skeleton}`}
    />
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
  if (props.skeleton) {
    return <LabelSkeleton {...props} />;
  }

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
  skeleton: PropTypes.bool,
};
