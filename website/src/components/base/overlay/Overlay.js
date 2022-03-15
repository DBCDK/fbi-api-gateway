import _Overlay from "react-bootstrap/Overlay";
import _Popover from "react-bootstrap/Popover";

import styles from "./Overlay.module.css";

export default function Overlay({ show = false, container, children }) {
  return (
    <_Overlay
      show={show}
      target={container?.current}
      placement="bottom"
      containerPadding={20}
    >
      <_Popover id="popover-contained" className={styles.container}>
        <div className={styles.body}>{children}</div>
      </_Popover>
    </_Overlay>
  );
}
