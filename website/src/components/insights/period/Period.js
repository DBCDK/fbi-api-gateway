import { useEffect, useState } from "react";
import styles from "./Period.module.css";

const UNITS = [
  { value: "days", label: "Days" },
  { value: "weeks", label: "Weeks" },
  { value: "months", label: "Months" },
  { value: "years", label: "Years" },
];

function normalizeAmount(value) {
  const amount = Number(value);
  return Number.isFinite(amount) ? Math.max(1, Math.floor(amount)) : 1;
}

export default function Period({ value, onChange, className, title }) {
  const amount = normalizeAmount(value?.amount);
  const unit = UNITS.some(({ value: key }) => key === value?.unit)
    ? value.unit
    : "days";
  const [draft, setDraft] = useState(String(amount));

  useEffect(() => {
    setDraft(String(amount));
  }, [amount]);

  const update = (nextAmount, nextUnit = unit) => {
    onChange?.({ amount: normalizeAmount(nextAmount), unit: nextUnit });
  };

  return (
    <div
      className={[styles.period, className].filter(Boolean).join(" ")}
      title={title}
    >
      <button
        type="button"
        onClick={() => update(amount - 1)}
        disabled={amount <= 1}
        aria-label={`One fewer ${unit}`}
      >
        −
      </button>
      <input
        type="number"
        inputMode="numeric"
        min="1"
        value={draft}
        onChange={(event) => setDraft(event.target.value)}
        onBlur={() => update(draft)}
        onKeyDown={(event) => {
          if (event.key === "Enter") event.currentTarget.blur();
        }}
        aria-label="Period amount"
      />
      <label className={styles.selectWrap}>
        <span className={styles.srOnly}>Period unit</span>
        <select
          value={unit}
          onChange={(event) => update(amount, event.target.value)}
        >
          {UNITS.map((item) => (
            <option key={item.value} value={item.value}>
              {item.label}
            </option>
          ))}
        </select>
      </label>
      <button
        type="button"
        onClick={() => update(amount + 1)}
        aria-label={`One more ${unit}`}
      >
        +
      </button>
    </div>
  );
}
