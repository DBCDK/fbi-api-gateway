import styles from "./Badge.module.css";

export default function Badge({ children = "!", className = "", ...props }) {
  return <span className={`${styles.badge} ${className}`} {...props}>{children}</span>;
}
