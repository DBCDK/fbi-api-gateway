import styles from "./Ghost.module.css";

export default function Ghost() {
  return (
    <div className={styles.ghost}>
      <div className={styles.eyes}>
        <div className={styles.eye} />
        <div className={styles.eye} />
      </div>
      <div className={styles.mouth} />
      <div className={styles.shadow} />
    </div>
  );
}
