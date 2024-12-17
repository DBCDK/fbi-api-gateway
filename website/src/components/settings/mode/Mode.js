import Dropdown from "react-bootstrap/Dropdown";
import Tooltip from "react-bootstrap/Tooltip";
import OverlayTrigger from "react-bootstrap/OverlayTrigger";

import useMode from "@/hooks/useMode";

import styles from "./Mode.module.css";

const modes = [
  { label: "light", icon: "🌞" },
  { label: "dark", icon: "🌛" },
  { label: "system", icon: "🤖" },
  // { label: "theme", icon: "🎨" },
];

export function Mode({ mode, onClick, className = "" }) {
  const isSelected =
    modes.find((t) => t.label === mode) || modes[modes.length - 1];

  return (
    <Dropdown
      className={`${styles.wrap} ${className}`}
      align="end"
      drop="up-centered"
    >
      <OverlayTrigger
        placement="bottom"
        overlay={
          <Tooltip className={styles.tooltip} id={`tooltip-mode`}>
            {"Mode"}
          </Tooltip>
        }
      >
        <Dropdown.Toggle className={styles.toggle} id="dropdown-mode-select">
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
  const { mode, setMode } = useMode();
  return (
    <Mode mode={mode} onClick={(newMode) => setMode(newMode)} {...props} />
  );
}
