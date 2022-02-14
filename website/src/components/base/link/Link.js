import PropTypes from "prop-types";
import { default as NextLink } from "next/link";

import styles from "./Link.module.css";

/**
 * The Component function
 *
 * @param {obj} props
 * See propTypes for specific props and types
 *
 * @returns {component}
 */
export default function Link({
  children = "Im a hyperlink now!",
  a = true,
  href,
  target = "_self",
  onClick = null,
  className = "",
  tabIndex = "0",
  tag = "a",
  disabled = false,
  scroll = true,
}) {
  const Tag = tag;
  // Maybe wrap with an a-tag
  if (a) {
    const disabledClass = disabled ? styles.disabled : "";

    children = (
      <Tag
        target={target}
        onClick={(e) => {
          if (onClick) {
            if (!href) {
              e.preventDefault();
            }
            onClick(e);
          }
        }}
        className={`${styles.link} ${disabledClass} ${className}`}
        tabIndex={disabled ? "-1" : tabIndex}
      >
        {children}
      </Tag>
    );
  }

  if (!href) {
    return children;
  }

  // Return the component
  return (
    <NextLink href={href} shallow={true} scroll={scroll}>
      {children}
    </NextLink>
  );
}

// PropTypes for component
Link.propTypes = {
  children: PropTypes.oneOfType([
    PropTypes.string,
    PropTypes.object,
    PropTypes.array,
  ]),
  target: PropTypes.oneOf(["_blank", "_self", "_parent", "_top"]),
  a: PropTypes.bool,
  className: PropTypes.oneOfType([PropTypes.string, PropTypes.object]),
  href: PropTypes.oneOfType([
    PropTypes.string,
    PropTypes.shape({
      pathname: PropTypes.string.isRequired,
      query: PropTypes.object,
    }),
    PropTypes.object,
  ]),
  tabIndex: PropTypes.string,
  tag: PropTypes.oneOf(["a", "span"]),
  disabled: PropTypes.bool,
};
