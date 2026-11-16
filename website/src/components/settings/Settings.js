import Dropdown from "react-bootstrap/Dropdown";
import Tooltip from "react-bootstrap/Tooltip";
import OverlayTrigger from "react-bootstrap/OverlayTrigger";

import Mode from "./mode";
import Execute from "./execute";
import Network from "./network";
import Storage from "./storage";
import useCredentialNetwork from "@/hooks/credentials/useCredentialNetwork";
import useInternalNetworkCheck from "@/hooks/credentials/useInternalNetworkCheck";
import indicatorStyles from "./NetworkOverride.module.css";

import styles from "./Settings.module.css";

export default function Settings({ className = "" }) {
  const { isInternal } = useCredentialNetwork();
  const { disableInternalNetworkCheck } = useInternalNetworkCheck();
  const hasNetworkOverride = isInternal && disableInternalNetworkCheck;
  const label = hasNetworkOverride
    ? "External mode enabled"
    : "Settings";

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
            {label}
          </Tooltip>
        }
      >
        <Dropdown.Toggle
          className={`${styles.toggle} ${indicatorStyles.toggle}`}
          id="dropdown-settings-select"
          aria-label={label}
        >
          {"⚙️"}
          {hasNetworkOverride && (
            <span className={indicatorStyles.badge} aria-hidden="true">!</span>
          )}
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
            hasNetworkOverride={hasNetworkOverride}
            className={styles.item}
            style={{ "--settings-item-delay": "0.18s" }}
          />
        )}
      </Dropdown.Menu>
    </Dropdown>
  );
}
