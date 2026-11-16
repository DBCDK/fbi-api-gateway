import Dropdown from "react-bootstrap/Dropdown";
import Tooltip from "react-bootstrap/Tooltip";
import OverlayTrigger from "react-bootstrap/OverlayTrigger";

import useInternalNetworkCheck from "@/hooks/credentials/useInternalNetworkCheck";

import styles from "./Network.module.css";
import indicatorStyles from "../NetworkOverride.module.css";

const modes = [
  { label: "Internal", value: "enabled", icon: "🏠" },
  { label: "External", value: "disabled", icon: "🌍" },
];

export function Network({ mode, onClick, hasNetworkOverride = false, className = "", ...props }) {
  const label = hasNetworkOverride
    ? "External mode enabled"
    : "Network";
  const isSelected =
    modes.find((item) => item.value === mode) || modes[modes.length - 1];

  return (
    <Dropdown
      {...props}
      className={`${styles.wrap} ${className}`}
      align="end"
      drop="down-centered"
    >
      <OverlayTrigger
        placement="top"
        overlay={
          <Tooltip className={styles.tooltip} id="tooltip-network">
            {label}
          </Tooltip>
        }
      >
        <Dropdown.Toggle
          className={`${styles.toggle} ${indicatorStyles.toggle}`}
          id="dropdown-network-select"
          aria-label={label}
        >
          {isSelected?.icon}
          {hasNetworkOverride && (
            <span className={indicatorStyles.badge} aria-hidden="true">!</span>
          )}
        </Dropdown.Toggle>
      </OverlayTrigger>

      <Dropdown.Menu className={styles.menu}>
        {modes.map(({ label, value, icon }) => (
          <OverlayTrigger
            key={value}
            placement="left"
            overlay={
              <Tooltip
                className={styles.tooltip}
                id={`tooltip-network-${value}`}
              >
                {label}
              </Tooltip>
            }
          >
            <Dropdown.Item
              className={styles.item}
              onClick={() => onClick(value)}
            >
              {icon}
            </Dropdown.Item>
          </OverlayTrigger>
        ))}
      </Dropdown.Menu>
    </Dropdown>
  );
}

export default function Wrap(props) {
  const { internalNetworkCheck, setInternalNetworkCheck } =
    useInternalNetworkCheck();

  return (
    <Network
      mode={internalNetworkCheck}
      onClick={(newMode) => setInternalNetworkCheck(newMode)}
      {...props}
    />
  );
}
