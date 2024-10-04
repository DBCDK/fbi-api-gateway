import { useEffect, useRef, useState } from "react";
import config from "../../../../../src/config.js";
import Chart from "../chart";

export default function Demo() {
  const [value, setValue] = useState(5);
  const interval = useRef();

  const values = [5, 12, 7, 2, 25, 10];

  useEffect(() => {
    if (!interval.current) {
      interval.current = setInterval(() => {
        const total = values.length;

        setValue((prevValue) => {
          const idx = values.indexOf(prevValue);
          const next = idx + 1 === total ? 0 : idx + 1;
          return values[next];
        });
      }, 4000);
    }
  }, []);

  return (
    <Chart
      value={value}
      limit={config?.query?.maxDepth}
      speed={50}
      states={{
        0: { color: "var(--success-dark)" },
        60: { color: "var(--warning-dark)" },
        100: { color: "var(--error)" },
      }}
    />
  );
}
