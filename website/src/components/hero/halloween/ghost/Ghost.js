import styles from "./Ghost.module.css";

export default function Ghost() {
  return (
    <div className={styles.container}>
      <div className={styles.spooky}>
        <div className={styles.body}>
          <div className={styles.eyes} />
          <div className={styles.mouth} />
          <div className={styles.feet}>
            <div></div>
            <div></div>
            <div></div>
          </div>
        </div>
      </div>
      <div className={styles.shadow} />
    </div>
  );
}
