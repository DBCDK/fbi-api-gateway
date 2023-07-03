import styles from "./Halloween.module.css";

import Ghost from "./ghost";
import Spiders from "./spiders";

export default function Halloween() {
  return (
    <div className={styles.halloween}>
      <div className={styles.dimmer} />
      <Spiders />
      <Ghost />
    </div>
  );
}
