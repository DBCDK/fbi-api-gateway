import styles from "./Spider.module.css";

export default function Spider() {
  return (
    <div className={styles.wrap}>
      <div>
        <div className={styles.spider}>
          <div className={`${styles.eye} ${styles.left}`} />
          <div className={`${styles.eye} ${styles.right}`} />
          {[...Array(4)].map((k) => (
            <span className={`${styles.leg} ${styles.left}`} />
          ))}
          {[...Array(4)].map((k) => (
            <span className={`${styles.leg} ${styles.right}`} />
          ))}
        </div>
      </div>
    </div>
  );
}
