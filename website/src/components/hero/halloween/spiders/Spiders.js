import styles from "./Spiders.module.css";

function Spider({ className = "" }) {
  return (
    <div className={`${styles.wrap} ${className}`}>
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
  );
}

export default function Spiders() {
  return (
    <div className={styles.spiders}>
      {[...Array(6)].map((k, i) => (
        <Spider className={styles[`wrap_${i}`]} />
      ))}
    </div>
  );
}
