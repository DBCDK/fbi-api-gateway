import Text from "@/components/base/text";
import styles from "./Title.module.css";

export default function Title({ children = null }) {
  return (
    <span className={styles.wrap}>
      <span>{children}</span>
      <span className={styles.icon}>☢️</span>
      <Text as="span" type="text4" className={styles.deprecation}>
        {`[DEPRECATED]`}
      </Text>
    </span>
  );
}
