import styles from "./Halloween.module.css";

import Ghost from "./ghost";
import Spiders from "./spiders";
import Spider from "./spider";
import Flashlight from "./flashlight";
import Graveyard from "./graveyard";

import Rain from "@/components/hero/halloween/rain";

export default function Halloween() {
  return (
    <div className={styles.halloween}>
      <div className={styles.dimmer} />
      <Flashlight />
      <Rain />
      <Graveyard />
      {/* <Spider /> */}
      {/* <Spiders /> */}
      <Ghost />
    </div>
  );
}
