import styles from "./Graveyard.module.css";

export default function Graveyard() {
  return (
    <div className={styles.wrap}>
      <div className={styles.hill}>
        <div className={styles.tomb} />
      </div>
    </div>
  );
}
