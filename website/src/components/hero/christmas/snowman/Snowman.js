import styles from "./Snowman.module.css";

export default function Snowman() {
  return (
    <div className={styles.container}>
      <div className={styles.snowman}>
        <div className={styles.body}>
          <div className={styles.head}></div>
          <div className={styles.hat}></div>
          <div className={styles.scarf}></div>
          <div className={styles.buttons}></div>
          <div className={styles.hands}>
            <div className={styles["right-hand"]}></div>
            <div className={styles["left-hand"]}></div>
          </div>
          <div className={styles.shadow}></div>
        </div>
      </div>
    </div>
  );
}
