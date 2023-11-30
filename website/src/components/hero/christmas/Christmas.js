import Snow from "./snow";
import Reindeer from "./reindeer";
import Santa from "./santa";
import Snowman from "./snowman";

import styles from "./Christmas.module.css";

export default function Christmas() {
  return (
    <div>
      <Snow />
      <Reindeer classsName={styles.reindeer} />
      {/* <Santa classsName={styles.santa} /> */}
      <Snowman classsName={styles.snowman} />
    </div>
  );
}
