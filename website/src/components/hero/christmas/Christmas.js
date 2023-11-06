import Snow from "./snow";
import Reindeer from "./reindeer";

import styles from "./Christmas.module.css";

export default function Christmas() {
  return (
    <div>
      <Snow />
      <Reindeer hest="fisk" classsName={styles.reindeer} />
    </div>
  );
}
