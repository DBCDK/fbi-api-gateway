// components/insights/Canvas.jsx
import { Offcanvas, Table, Badge } from "react-bootstrap";
import styles from "./Canvas.module.css";

export default function Canvas({
  show,
  onHide,
  type,
  field,
  isDeprecated = false,
  totalCount = 0,
  clientUsage = [], // [{ clientId, count }]
  container, // DOM-node fra shellRef.current
}) {
  const hasSelection = Boolean(type && field);
  const usedBy = clientUsage.length;

  return (
    <Offcanvas
      className={styles.canvas}
      show={show}
      onHide={onHide}
      placement="start"
      scroll
      backdrop={false}
      container={container}
    >
      <Offcanvas.Header closeButton>
        <Offcanvas.Title>
          {hasSelection ? (
            <>
              <code>
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
        </Offcanvas.Title>
      </Offcanvas.Header>

      <Offcanvas.Body>
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
      </Offcanvas.Body>
    </Offcanvas>
  );
}
