import PropTypes from "prop-types";
import Text from "@/components/base/text";

import styles from "./Box.module.css";

export default function Box({ children, deprecated, expires }) {
  return (
    <div className={styles.deprecation}>
      <div className={styles.info}>
        <Text className={styles.warning} type="text5">
          Deprecation Warning! ☢️
        </Text>
        <div>
          <Text type="text4" className={styles.deprecated}>
            Deprecated:
            <Text as="span" type="text1" className={styles.date}>
              {deprecated}
            </Text>
          </Text>
          <Text type="text4" className={styles.expires}>
            Expires:
            <Text as="span" type="text1" className={styles.date}>
              {expires}
            </Text>
          </Text>
        </div>
      </div>
      {children}
    </div>
  );
}

// PropTypes for the component
Box.propTypes = {
  children: PropTypes.any,
  deprecated: PropTypes.string.isRequired,
  expires: PropTypes.string.isRequired,
};
