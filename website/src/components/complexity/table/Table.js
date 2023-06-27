import { useMemo } from "react";
import _Table from "react-bootstrap/Table";

import data from "./data.json";

import styles from "./Table.module.css";

export default function Table() {
  return (
    <_Table className={styles.table} responsive="md">
      <thead>
        <tr>
          <th>#</th>
          <th>Field</th>
          <th>Value</th>
          <th>Multipliers</th>
        </tr>
      </thead>

      <tbody className={styles.body}>
        {data.map((d, idx) => (
          <tr key={`complexity-${d.field}-${idx}`}>
            <td>{idx + 1}</td>
            {Object.values(d).map((v, idx) => (
              <td key={`${v}-${idx}`}>{v}</td>
            ))}
          </tr>
        ))}
      </tbody>
    </_Table>
  );
}
