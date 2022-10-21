import { useEffect } from "react";
import { _snow } from "./utils";

import styles from "./Snow.module.css";

export default function Snow() {
  useEffect(() => _snow(), []);
  return <canvas id="canvas" className={styles.snow} />;
}
