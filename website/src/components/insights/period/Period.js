// components/insights/period/Period.jsx (eller hvor din Period ligger)
import { useEffect, useMemo, useState } from "react";
import styles from "./Period.module.css";

const DEFAULT_STEPS = [1, 3, 7, 14, 21, 30];
const MIN = 1;
const MAX = 30;

function clamp(n, min = MIN, max = MAX) {
  if (!Number.isFinite(n)) return min;
  return Math.max(min, Math.min(max, Math.floor(n)));
}

function isStep(val, steps) {
  return steps.includes(val);
}

function nearestIndex(val, steps, prefer = "up") {
  // returnerer index for nærmeste trin; ved tie bruges prefer: "up" | "down"
  let bestIdx = 0;
  let bestDist = Infinity;
  for (let i = 0; i < steps.length; i++) {
    const d = Math.abs(steps[i] - val);
    if (d < bestDist) {
      bestDist = d;
      bestIdx = i;
    } else if (d === bestDist) {
      // tie: vælg op eller ned afhængigt af prefer
      if (prefer === "up" && steps[i] > steps[bestIdx]) bestIdx = i;
      if (prefer === "down" && steps[i] < steps[bestIdx]) bestIdx = i;
    }
  }
  return bestIdx;
}

export default function Period({
  value, // optional (kontrolleret)
  onChange, // optional (kontrolleret)
  steps = DEFAULT_STEPS,
  min = MIN,
  max = MAX,
  className,
}) {
  const isControlled = typeof value === "number";
  const [internal, setInternal] = useState(() => steps[3] ?? 14); // default 14
  const days = isControlled ? value : internal;

  // sync intern state hvis kontrolleret værdi ændres
  useEffect(() => {
    if (isControlled) return;
    // no-op for ukontrolleret
  }, [isControlled]);

  const setDays = (n) => {
    const clamped = clamp(n, min, max);
    if (isControlled) {
      onChange?.(clamped);
    } else {
      setInternal(clamped);
      onChange?.(clamped);
    }
  };

  const handlePlus = () => {
    if (!Number.isFinite(days)) return setDays(steps[0]);
    const d = clamp(days, min, max);
    if (!isStep(d, steps)) {
      // snap først til nærmeste; tie -> op
      const idx = nearestIndex(d, steps, "up");
      return setDays(steps[idx]);
    }
    const idx = steps.indexOf(d);
    if (idx < steps.length - 1) setDays(steps[idx + 1]);
  };

  const handleMinus = () => {
    if (!Number.isFinite(days)) return setDays(steps[0]);
    const d = clamp(days, min, max);
    if (!isStep(d, steps)) {
      // snap først til nærmeste; tie -> ned
      const idx = nearestIndex(d, steps, "down");
      return setDays(steps[idx]);
    }
    const idx = steps.indexOf(d);
    if (idx > 0) setDays(steps[idx - 1]);
  };

  const onInputChange = (e) => {
    const raw = e.target.value;
    // tillad tom streng i feltet mens man taster
    if (raw === "") {
      if (!isControlled) setInternal(NaN);
      return;
    }
    const n = Number(raw);
    if (!Number.isFinite(n)) return;
    // opdater uden at clamp’e hårdt ved typing (clamp ved blur/knapper)
    if (isControlled) {
      onChange?.(clamp(n, min, max));
    } else {
      setInternal(n);
    }
  };

  const onInputBlur = () => {
    // clamp ved blur
    const n = Number(days);
    setDays(clamp(n, min, max));
  };

  // visningsværdi i input (tillad tom når ukontrolleret og NaN)
  const inputValue = useMemo(() => {
    if (!isControlled && !Number.isFinite(internal)) return "";
    return String(days ?? "");
  }, [isControlled, internal, days]);

  return (
    <div className={[styles.period, className].filter(Boolean).join(" ")}>
      <button type="button" onClick={handleMinus} aria-label="Færre dage">
        −
      </button>
      <input
        type="number"
        inputMode="numeric"
        min={min}
        max={max}
        value={inputValue}
        onChange={onInputChange}
        onBlur={onInputBlur}
        aria-label="Antal dage"
      />
      <button type="button" onClick={handlePlus} aria-label="Flere dage">
        +
      </button>
    </div>
  );
}
