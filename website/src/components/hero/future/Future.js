import DeLorean from "./delorean/DeLorean";

import styles from "./Future.module.css";
import Storm from "./storm/Storm";

export default function Future() {
  return (
    <div className={styles.container}>
      <DeLorean />
      <Storm />
    </div>
  );
}
