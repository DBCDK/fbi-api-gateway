import { useEffect, useState, useRef } from "react";

import styles from "./Circle.module.css";

/**
 *
 * @param {object} params
 * @param {int} params.timer current progress time
 * @param {int} params.limit max limit
 * @param {object} params.states state settings
 * @returns
 */
function getStateColor({ timer, limit, states }) {
  // Percentage of limit
  const percentage = Math.round((timer / limit) * 100);

  const sorted = Object.fromEntries(Object.entries(states).sort());
  let color;
  Object.entries(sorted).forEach(([k, v]) => {
    if (k <= percentage) {
      color = v.color;
    }
  });
  return color;
}

/**
 *
 * @param {object} params
 * @param {int} params.value target value
 * @param {int} params.limit max limit
 * @param {int} params.speed interval speed
 * @param {object} params.states state settings
 * @param {any} params.className target value
 * @returns
 */

export default function Circle({
  value = null,
  limit = 360,
  speed = 100,
  states = {
    0: { color: "var(--primary)" },
  },
  className = "",
}) {
  const [timer, setTimer] = useState(0);
  const [direction, setDirection] = useState();
  const interval = useRef();

  useEffect(() => {
    function handleTimer() {
      interval.current = setInterval(() => {
        // calc distance between start/stop
        const dist = Math.abs(value - timer);
        // acc is used for accelerating on long distance between start/stop
        const acc = Math.round(dist / 100) || 1;
        setTimer((count) => (timer < value ? count + acc : count - acc));
      }, speed);
    }

    // always cleanup on value change
    clearInterval(interval.current);

    if (value) {
      setDirection(timer < value ? "ADD" : "SUB");
      handleTimer();
    }
    // reset timer if given value is undefined
    else {
      setTimer(0);
    }
  }, [value]);

  useEffect(() => {
    if (interval.current) {
      // adds or substracts depending on direction
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
  const ERR = !value && "...";

  const errorClass = !!ERR ? styles.err : "";

  // Progress degress
  const deg = (timer / 1000) * 360;

  // Custom class
  const color = getStateColor({ timer, limit, states });

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
