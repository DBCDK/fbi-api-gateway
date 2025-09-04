import Dropdown from "react-bootstrap/Dropdown";

import styles from "./Period.module.css";

export default function Period() {
  const selectedClass = "";

  return (
    <div className={styles.period}>
      <button>+</button>
      <input value={14} input="number" />
      <button>-</button>
    </div>
  );

  return (
    <Dropdown className={styles.dropdown} align="end" title="Search profile">
      <Dropdown.Toggle id="period-dropdown" className={styles.toggle}>
        hej
      </Dropdown.Toggle>
      <Dropdown.Menu className={styles.menu}>
        <Dropdown.Header>Search Profiles</Dropdown.Header>
        {/* <Dropdown.Divider /> */}
        {[...Array(30)].map((_, idx) => (
          <Dropdown.Item
            key={`item-${idx}`}
            className={`${styles.item} ${selectedClass}`}
            onClick={() => {}}
          >
            {idx + 1}
          </Dropdown.Item>
        ))}
      </Dropdown.Menu>
    </Dropdown>
  );
}
