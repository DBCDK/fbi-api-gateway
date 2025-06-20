import { useEffect, useRef, useState } from "react";
import Chart from "../chart";

export default function Demo() {
  const [value, setValue] = useState(650);
  const interval = useRef();

  const values = [650, 225, 1200, 5000, 1800, 25];

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
      limit={2500}
      speed={1}
      states={{
        0: { color: "var(--success-dark)" },
        10: { color: "var(--warning-dark)" },
        100: { color: "var(--error)" },
      }}
    />
  );
}
