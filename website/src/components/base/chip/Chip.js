import { useId } from "react";
import styles from "./Chip.module.css";

/**
 * Props:
 * - mode: "boolean" | "tri" (default "boolean")
 * - checked: boolean (boolean-mode)
 * - state: "off" | "include" | "exclude"  (tri-mode)
 * - onChange: (next: boolean | "off"|"include"|"exclude") => void
 * - disabled?: boolean
 */
export default function Chip({
  children,
  mode = "boolean",
  checked = false,
  state = "off",
  onChange,
  disabled,
}) {
  const id = useId();

  if (mode === "tri") {
    const next =
      state === "off" ? "include" : state === "include" ? "exclude" : "off";

    return (
      <button
        type="button"
        className={styles.chip}
        data-mode="tri"
        data-state={state}
        onClick={() => onChange?.(next)}
        aria-pressed={state !== "off"}
        disabled={disabled}
        title={
          state === "off"
            ? "Filter: fra"
            : state === "include"
              ? "Filter: inkluder"
              : "Filter: ekskluder"
        }
      >
        <span className={styles.dot} aria-hidden>
          {state === "include" ? "✓" : state === "exclude" ? "✕" : "•"}
        </span>
        {children}
      </button>
    );
  }

  // boolean-mode (din eksisterende struktur)
  return (
    <span className={styles.chip}>
      <input
        type="checkbox"
        id={id}
        checked={checked}
        disabled={disabled}
        onChange={(e) => onChange?.(e.target.checked)}
      />
      <label htmlFor={id}>{children}</label>
    </span>
  );
}
