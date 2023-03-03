import Dropdown from "react-bootstrap/Dropdown";
import Tooltip from "react-bootstrap/Tooltip";
import OverlayTrigger from "react-bootstrap/OverlayTrigger";

import useTheme from "@/hooks/useTheme";

import styles from "./Theme.module.css";

const themes = [
  { label: "light", icon: "🌞" },
  { label: "dark", icon: "🌛" },
  { label: "system", icon: "🤖" },
];

export function Theme({ theme, onClick, className = "" }) {
  const isSelected =
    themes.find((t) => t.label === theme) || themes[themes.length - 1];

  return (
    <Dropdown
      className={`${styles.wrap} ${className}`}
      align="end"
      drop="up-centered"
    >
      <OverlayTrigger
        placement="left"
        overlay={
          <Tooltip className={styles.tooltip} id={`tooltip-theme`}>
            {"Theme"}
          </Tooltip>
        }
      >
        <Dropdown.Toggle className={styles.toggle} id="dropdown-theme-select">
          {isSelected?.icon}
        </Dropdown.Toggle>
      </OverlayTrigger>

      <Dropdown.Menu className={styles.menu}>
        {themes.map(({ label, icon }) => (
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
  const { theme, setTheme } = useTheme();
  return (
    <Theme
      theme={theme}
      onClick={(newTheme) => setTheme(newTheme)}
      {...props}
    />
  );
}
