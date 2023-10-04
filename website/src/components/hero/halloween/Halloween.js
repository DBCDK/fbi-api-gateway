import styles from "./Halloween.module.css";

import Ghost from "./ghost";
import Spiders from "./spiders";
import Spider from "./spider";
import Graveyard from "./graveyard";

import Rain from "@/components/hero/halloween/rain";

export default function Halloween() {
  return (
    <div className={styles.halloween}>
      {/* <div className={styles.dimmer} /> */}
      <Rain />
      {/* <Graveyard /> */}
      {/* <Spider /> */}
      {/* <Spiders /> */}
      <Ghost />
    </div>
  );
}
