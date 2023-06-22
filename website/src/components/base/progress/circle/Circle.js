import { useEffect, useState, useRef } from "react";

import styles from "./Circle.module.css";

/**
 *
 * @param {*} param0
 * @returns
 */
function getStateColor({ value, states }) {
  const sorted = Object.fromEntries(Object.entries(states).sort());

  let color;
  Object.entries(sorted).forEach(([k, v]) => {
    if (k <= value) {
      color = v;
    }
  });

  return color;
}

/**
 *
 * @param {*} param0
 * @returns
 */

export default function Circle({
  value = null,
  limit = 360,
  speed = 1,
  states = {
    0: "var(--primary)",
  },
  className = "",
}) {
  const [timer, setTimer] = useState(0);
  const [direction, setDirection] = useState();
  const interval = useRef();

  useEffect(() => {
    console.log("effect 1", { timer, value, direction });

    function handleTimer() {
      interval.current = setInterval(() => {
        const hest = Math.round(value / 100) || 1;

        console.log("hest", hest);

        setTimer((count) => (timer < value ? count + hest : count - hest));
      }, speed);
    }

    // always cleanup on value change
    clearInterval(interval.current);

    if (value) {
      setDirection(timer < value ? "ADD" : "SUB");
      handleTimer();
    }
    // reset timer
    else {
      setTimer(0);
    }
  }, [value]);

  useEffect(() => {
    console.log("effect 2", { timer, value, direction });

    if (interval.current) {
      const done =
        (direction === "ADD" && timer >= value) ||
        (direction === "SUB" && timer <= value);

      if (done) {
        clearInterval(interval.current);
        setTimer(value);
      }
    }
  }, [timer]);

  // Set error on missing value
  const ERR = !value && "😵‍💫";

  const errorClass = !!ERR ? styles.err : "";

  // Progress degress
  const deg = (timer / 1000) * 360;

  // Percentage of limit
  const percentage = Math.round((timer / limit) * 100);

  // custom class
  const color = getStateColor({ value: percentage, states });

  // Set inline dynamic style
  const objStyles = {
    background: `conic-gradient(${color} ${deg}deg, transparent 0deg)`,
  };

  return (
    <div
      className={`${styles.bar} ${errorClass} ${className}`}
      style={objStyles}
    >
      <span className={styles.value}>{ERR || timer}</span>
    </div>
  );
}
