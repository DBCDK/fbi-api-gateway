import styles from "./Chip.module.css";

export default function Chip({ children, checked, onChange, disabled }) {
  return (
    <span className={styles.chip}>
      <input
        type="checkbox"
        id={children}
        checked={checked}
        disabled={disabled}
        onChange={(e) => onChange(e.target.checked)}
      />
      <label htmlFor={children}>{children}</label>
    </span>
  );
}
