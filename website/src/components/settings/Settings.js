import Dropdown from "react-bootstrap/Dropdown";
import Tooltip from "react-bootstrap/Tooltip";
import OverlayTrigger from "react-bootstrap/OverlayTrigger";

import Mode from "./mode";
import Execute from "./execute";
import Network from "./network";
import Storage from "./storage";
import useCredentialNetwork from "@/hooks/credentials/useCredentialNetwork";

import styles from "./Settings.module.css";

export default function Settings({ className = "" }) {
  const { isInternal } = useCredentialNetwork();

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
        <Storage
          className={styles.item}
          style={{ "--settings-item-delay": "0s" }}
        />
        <Execute
          className={styles.item}
          style={{ "--settings-item-delay": "0.06s" }}
        />
        <Mode
          className={styles.item}
          style={{ "--settings-item-delay": "0.12s" }}
        />
        {isInternal && (
          <Network
            className={styles.item}
            style={{ "--settings-item-delay": "0.18s" }}
          />
        )}
      </Dropdown.Menu>
    </Dropdown>
  );
}
