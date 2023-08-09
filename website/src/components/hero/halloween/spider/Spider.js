import styles from "./Spider.module.css";

export default function Spider() {
  return (
    <div className={styles.wrap}>
      <div>
        <div className={styles.spider}>
          <div className={`${styles.eye} ${styles.left}`} />
          <div className={`${styles.eye} ${styles.right}`} />
          {[...Array(4)].map((k, idx) => (
            <span
              key={`leg-left-${idx}`}
              className={`${styles.leg} ${styles.left}`}
            />
          ))}
          {[...Array(4)].map((k, idx) => (
            <span
              key={`leg-right-${idx}`}
              className={`${styles.leg} ${styles.right}`}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
