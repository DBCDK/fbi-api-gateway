import { Table } from "react-bootstrap";
import useStorage from "@/hooks/useStorage";
import useInsights from "@/hooks/useInsights";
import styles from "./Result.module.css";

export default function Result({ data }) {
  const { selectedToken } = useStorage();
  const { byFieldMap } = useInsights(selectedToken);

  return (
    <Table className={styles.table} responsive="md">
      <thead>
        <tr>
          <th>#</th>
          <th>Field</th>
          <th>Deprecated</th>
          <th>Count</th>
          <th>Complexity</th>
        </tr>
      </thead>

      <tbody className={styles.body}>
        {data?.map((obj, idx) => {
          const { field, type, isDeprecated, description } = obj || {};
          const key = type && field ? `${type}.${field}` : null;
          const count = key && byFieldMap ? (byFieldMap[key]?.count ?? 0) : 0;

          return (
            <tr
              key={key || `${idx}-${field}`}
              className={styles.result}
              title={description || ""}
            >
              <td>{idx + 1}</td>
              <td>
                <span className={styles.type}>{type}</span>.{field}
              </td>
              <td>{isDeprecated ? "true" : "false"}</td>
              <td>{count}</td>
              <td>1</td>
            </tr>
          );
        })}
      </tbody>
    </Table>
  );
}
