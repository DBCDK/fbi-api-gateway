import PropTypes from "prop-types";

import styles from "./Border.module.css";

export default function Border({ children }) {
  return <div className={styles.border}>{children}</div>;
}

// PropTypes for the component
Border.propTypes = {
  children: PropTypes.any,
};
