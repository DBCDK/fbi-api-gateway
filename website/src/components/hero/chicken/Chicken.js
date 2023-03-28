import styles from "./Chicken.module.css";

export default function Chicken() {
  return (
    <div className={styles.container}>
      <div className={styles.chick}>
        <div className={styles.body}>
          <div className={styles.wing} />
          <div className={styles.beak} />
          <div className={styles.eye} />
          <div className={styles.blush} />
          <div className={styles.feather} />
        </div>
        <div className={styles["left-leg"]} />
        <div className={styles["right-leg"]} />
        <div className={styles.shadow} />
      </div>

      <div className={`${styles.cloud} ${styles.cloud1}`} />
      <div className={`${styles.cloud} ${styles.cloud2}`} />
      <div className={`${styles.cloud} ${styles.cloud3}`} />
      <div className={`${styles.cloud} ${styles.cloud4}`} />
      <div className={`${styles.cloud} ${styles.cloud5}`} />
    </div>
  );
}
