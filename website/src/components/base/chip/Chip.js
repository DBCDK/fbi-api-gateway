import styles from "./Chip.module.css";

export default function Chip({ children, checked, onChange, disabled }) {
  console.log(disabled);
  return (
    <span className={styles.chip}>
      <input
        type="checkbox"
        id={children}
        checked={checked}
        disabled={disabled}
        onChange={(e) => onChange(e.target.checked)}
      />
      <label for={children}>{children}</label>
    </span>
  );
}
