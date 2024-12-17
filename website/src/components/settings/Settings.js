import Dropdown from "react-bootstrap/Dropdown";
import Tooltip from "react-bootstrap/Tooltip";
import OverlayTrigger from "react-bootstrap/OverlayTrigger";

import Mode from "./mode";
import Execute from "./execute";

import styles from "./Settings.module.css";

export default function Settings({ className = "" }) {
  return (
    <Dropdown
      className={`${styles.wrap} ${className}`}
      align="start"
      drop="start"
      autoClose="outside"
    >
      <OverlayTrigger
        placement="bottom"
        overlay={
          <Tooltip className={styles.tooltip} id={`tooltip-settings`}>
            {"Settings"}
          </Tooltip>
        }
      >
        <Dropdown.Toggle
          className={styles.toggle}
          id="dropdown-settings-select"
        >
          {"⚙️"}
        </Dropdown.Toggle>
      </OverlayTrigger>

      <Dropdown.Menu className={styles.menu}>
        <Execute className={styles.item} />
        <Mode className={styles.item} />
      </Dropdown.Menu>
    </Dropdown>
  );
}
