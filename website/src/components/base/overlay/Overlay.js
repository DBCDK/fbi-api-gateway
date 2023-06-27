import _Overlay from "react-bootstrap/Overlay";
import _Popover from "react-bootstrap/Popover";

import styles from "./Overlay.module.css";

export default function Overlay({
  className = "",
  show = false,
  container,
  children,
  placement = "bottom",
}) {
  return (
    <_Overlay
      show={show}
      target={container?.current}
      placement={placement}
      containerPadding={20}
    >
      <_Popover
        id="popover-contained"
        className={`${styles.container} ${className}`}
      >
        <div className={styles.body}>{children}</div>
      </_Popover>
    </_Overlay>
  );
}
