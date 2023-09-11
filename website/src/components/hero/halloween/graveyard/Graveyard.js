import styles from "./Graveyard.module.css";

export default function Graveyard() {
  return (
    <div className={styles.wrap}>
      <div className={`${styles.hill} ${styles.large}`}>
        <div>
          <div className={styles.tomb}>
            <p>R.I.P</p>
          </div>
        </div>
      </div>
    </div>
  );
}
