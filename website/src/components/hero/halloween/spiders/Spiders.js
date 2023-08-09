import styles from "./Spiders.module.css";

function Spider({ idx, className = "" }) {
  return (
    <div className={`${styles.wrap} ${className}`}>
      <div className={styles.spider}>
        <div className={`${styles.eye} ${styles.left}`} />
        <div className={`${styles.eye} ${styles.right}`} />
        {[...Array(4)].map((k, i) => (
          <span
            key={`leg-left-${idx}-${i}`}
            className={`${styles.leg} ${styles.left}`}
          />
        ))}
        {[...Array(4)].map((k, i) => (
          <span
            key={`leg-right-${idx}-${i}`}
            className={`${styles.leg} ${styles.right}`}
          />
        ))}
      </div>
    </div>
  );
}

export default function Spiders() {
  return (
    <div className={styles.spiders}>
      {[...Array(6)].map((k, i) => (
        <Spider key={`spider-${i}`} idx={i} className={styles[`wrap_${i}`]} />
      ))}
    </div>
  );
}
