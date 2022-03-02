import _Dropdown from "react-bootstrap/Dropdown";

import styles from "./Dropdown.module.css";

export default function Dropdown({ className = "" }) {
  return (
    <_Dropdown className={`${styles.history} ${className}`} autoClose={true}>
      <_Dropdown.Toggle className={styles.button} id="dropdown-history">
        <span />
        <span />
        <span />
      </_Dropdown.Toggle>
      <_Dropdown.Menu>
        <_Dropdown.Item>Remove</_Dropdown.Item>
      </_Dropdown.Menu>
    </_Dropdown>
  );
}
