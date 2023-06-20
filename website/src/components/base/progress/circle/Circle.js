import { useEffect, useState, useRef } from "react";

import styles from "./Circle.module.css";

/**
 *
 * @param {*} param0
 * @returns
 */

export default function Circle({
  start = 0,
  stop = 0,
  value = null,
  speed = 10,
  className = "",
}) {
  const [progress, setProgress] = useState(start);

  console.log("hest", { start, stop, value, progress });

  useEffect(() => {
    // mounted
    if (stop) {
      // ensure stop is a valid int
      if (!isNaN(stop)) {
        const interval = setInterval(() => {
          console.log("hund", { progress, stop });

          if (progress < stop) {
            setProgress(progress++);
          }

          if (progress > stop) {
            setProgress(progress--);
          }

          if (progress === stop) {
            clearInterval(interval);
          }
        }, speed);
      }
    }
  }, [stop]);

  // Progress degress
  const deg = (progress / 100) * 360;

  // Set inline dynamic style
  const objStyles = {
    background: `conic-gradient(var(--primary) ${deg}deg, transparent 0deg)`,
  };

  return (
    <div className={`${styles.bar} ${className}`} style={objStyles}>
      <span className={styles.value}>{value || progress}</span>
    </div>
  );
}
