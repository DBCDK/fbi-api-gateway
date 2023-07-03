import styles from "./Pride.module.css";

export default function Pride() {
  return (
    <div className={styles.pride}>
      <div className={styles.wrap}>
        <div className={styles.dimmer} />
        <div className={styles.rainbow} />
      </div>
    </div>
  );
}
