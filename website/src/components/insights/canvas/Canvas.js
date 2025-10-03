import { Table, Badge } from "react-bootstrap";
import styles from "./Canvas.module.css";

export default function Canvas({
  show,
  onHide,
  type,
  field,
  isDeprecated = false,
  totalCount = 0,
  clientUsage = [],
}) {
  if (!show) return null;

  const hasSelection = Boolean(type && field);
  const usedBy = clientUsage.length;

  return (
    <div
      className={styles.canvasInner}
      role="region"
      aria-label="Insights panel"
    >
      <div className={styles.canvasHeader}>
        <h3 className={styles.canvasTitle}>
          {hasSelection ? (
            <>
              <code className={styles.canvasCode}>
                {type}.{field}
              </code>{" "}
              {isDeprecated && (
                <Badge bg="warning" text="dark">
                  deprecated
                </Badge>
              )}
            </>
          ) : (
            "Clients"
          )}
        </h3>
        <button
          type="button"
          className={styles.canvasClose}
          aria-label="Close"
          onClick={onHide}
        >
          ×
        </button>
      </div>

      <div className={styles.canvasBody}>
        {!hasSelection ? (
          <div className={styles.empty}>Select a row to see client usage.</div>
        ) : (
          <>
            <div className={styles.summary}>
              <small className="text-muted">
                Field is used by <strong>{usedBy}</strong> client
                {usedBy === 1 ? "" : "s"}
              </small>
              <div>
                <small className="text-muted me-1">Total</small>
                <Badge bg="secondary">{totalCount}</Badge>
              </div>
            </div>

            <div className={styles.tableWrap}>
              <Table className={styles.table} responsive="md" size="sm">
                <thead>
                  <tr>
                    <th style={{ width: 60 }}>#</th>
                    <th>Client</th>
                    <th className={styles.countCol}>Count</th>
                  </tr>
                </thead>
                <tbody className={styles.body}>
                  {clientUsage.map(({ clientId, count }, idx) => (
                    <tr key={clientId} className={styles.result}>
                      <td>{idx + 1}</td>
                      <td>{clientId}</td>
                      <td className={styles.countCol}>{count}</td>
                    </tr>
                  ))}
                </tbody>
              </Table>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
