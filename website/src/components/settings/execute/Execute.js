import Dropdown from "react-bootstrap/Dropdown";
import Tooltip from "react-bootstrap/Tooltip";
import OverlayTrigger from "react-bootstrap/OverlayTrigger";

import useExecute from "@/hooks/useExecute";

import styles from "./Execute.module.css";

const modes = [
  { label: "manual", icon: "🚲" },
  { label: "auto", icon: "🛵" },
];

export function Execute({ mode, onClick, className = "" }) {
  const isSelected =
    modes.find((t) => t.label === mode) || modes[modes.length - 1];

  return (
    <Dropdown
      className={`${styles.wrap} ${className}`}
      align="end"
      drop="down-centered"
    >
      <OverlayTrigger
        placement="top"
        overlay={
          <Tooltip
            placement="start"
            className={styles.tooltip}
            id={`tooltip-execute`}
          >
            {"Execute"}
          </Tooltip>
        }
      >
        <Dropdown.Toggle className={styles.toggle} id="dropdown-execute-select">
          {isSelected?.icon}
        </Dropdown.Toggle>
      </OverlayTrigger>

      <Dropdown.Menu className={styles.menu}>
        {modes.map(({ label, icon }) => (
          <OverlayTrigger
            key={label}
            placement="left"
            overlay={
              <Tooltip className={styles.tooltip} id={`tooltip-${label}`}>
                {label}
              </Tooltip>
            }
          >
            <Dropdown.Item
              className={styles.item}
              onClick={() => onClick(label)}
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
  const { execute, setExecute } = useExecute();

  return (
    <Execute
      mode={execute}
      onClick={(newMode) => setExecute(newMode)}
      {...props}
    />
  );
}
