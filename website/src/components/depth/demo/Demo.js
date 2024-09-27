import { useEffect, useRef, useState } from "react";
import config from "../../../../../src/config.js";
import Chart from "../chart";

export default function Demo() {
  const [value, setValue] = useState(5);
  const interval = useRef();

  const values = [5, 8, 15, 2, 6, 2, 25];

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
      speed={1}
      states={{
        0: { color: "var(--success-dark)" },
        20: { color: "var(--warning-dark)" },
        100: { color: "var(--error)" },
      }}
    />
  );
}
