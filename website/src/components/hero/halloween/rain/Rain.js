import { useEffect } from "react";
import { _rain } from "./utils";

import styles from "./Rain.module.css";

export default function Rain() {
  useEffect(() => _rain(), []);
  return (
    <div className={styles.wrap}>
      <canvas id="canvas" className={styles.rain} />

      <div className={styles.thunder} />
    </div>
  );
}
