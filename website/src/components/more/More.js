/**
 * @file Floating shortcut button for opening the app's secondary/user menu.
 */
import styles from "./More.module.css";

export default function More({ className = "", onClick = null }) {
  return (
    <button
      type="button"
      className={`${styles.more} ${className}`}
      onClick={onClick}
      aria-label="Open user menu"
    >
      <span className={styles.lines} aria-hidden="true">
        <span />
        <span />
        <span />
      </span>
    </button>
  );
}
