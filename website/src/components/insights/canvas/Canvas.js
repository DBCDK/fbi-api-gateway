import { useEffect, useMemo, useState } from "react";
import { Table, Badge } from "react-bootstrap";
import Button from "@/components/base/button";
import styles from "./Canvas.module.css";

const dateFormatter = new Intl.DateTimeFormat("en-GB", {
  dateStyle: "medium",
  timeStyle: "short",
  timeZone: "UTC",
});

function formatDate(value) {
  if (!value) return "Not recorded";
  const date = new Date(value);
  return Number.isNaN(date.getTime())
    ? value
    : `${dateFormatter.format(date)} UTC`;
}

function ClientDetails({
  client,
  clientUsageTotal,
  elementKey,
  elementLabel,
  copied,
  onCopy,
  onFilter,
}) {
  const {
    clientId,
    count = 0,
    operationCount = 0,
    firstSeen,
    lastSeen,
    configuration,
  } = client;
  const percentage = clientUsageTotal
    ? Math.round((count / clientUsageTotal) * 100)
    : 0;

  return (
    <div className={styles.details}>
      <section className={styles.identity}>
        {configuration?.displayName && (
          <strong className={styles.detailClientName}>
            {configuration.displayName}
          </strong>
        )}
        <div className={styles.clientIdRow}>
          <code>{clientId}</code>
          <button type="button" className={styles.textButton} onClick={onCopy}>
            {copied ? "Copied" : "Copy"}
          </button>
        </div>
      </section>

      <section className={styles.detailSection}>
        <div className={styles.sectionHeading}>
          <h4>Observed use</h4>
          <small>
            For {elementLabel.toLowerCase()} <code>{elementKey}</code>
          </small>
        </div>
        <dl className={styles.metrics}>
          <div>
            <dt>Usage</dt>
            <dd>
              {count} <small>({percentage}% of client usage)</small>
            </dd>
          </div>
          <div>
            <dt>Operations</dt>
            <dd>{operationCount}</dd>
          </div>
          <div>
            <dt>First seen</dt>
            <dd>{formatDate(firstSeen)}</dd>
          </div>
          <div>
            <dt>Last seen</dt>
            <dd>{formatDate(lastSeen)}</dd>
          </div>
        </dl>
      </section>

      <Button size="small" className={styles.primaryAction} onClick={onFilter}>
        Filter Insights by this client
      </Button>
    </div>
  );
}

export default function Canvas({
  show,
  onHide,
  onFilterClient,
  elementKey,
  elementLabel = "Field",
  isDeprecated = false,
  isDraft = false,
  clientUsage = [],
  isLoading = false,
}) {
  const [selectedClientId, setSelectedClientId] = useState(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    setSelectedClientId(null);
    setCopied(false);
  }, [elementKey, show]);

  const selectedClient = useMemo(
    () =>
      clientUsage.find(({ clientId }) => clientId === selectedClientId) || null,
    [clientUsage, selectedClientId]
  );
  const clientUsageTotal = useMemo(
    () => clientUsage.reduce((sum, client) => sum + (client.count || 0), 0),
    [clientUsage]
  );

  if (!show) return null;

  const hasSelection = Boolean(elementKey);
  const usedBy = clientUsage.length;

  const copyClientId = async () => {
    if (!selectedClient?.clientId || !navigator?.clipboard) return;
    try {
      await navigator.clipboard.writeText(selectedClient.clientId);
      setCopied(true);
    } catch {
      setCopied(false);
    }
  };

  return (
    <div
      className={styles.canvasInner}
      role="region"
      aria-label="Insights panel"
    >
      <div className={styles.canvasHeader}>
        <div className={styles.headerContent}>
          {selectedClient && (
            <button
              type="button"
              className={styles.backButton}
              aria-label="Back to clients"
              onClick={() => setSelectedClientId(null)}
            >
              ←
            </button>
          )}
          <h3 className={styles.canvasTitle}>
            {selectedClient ? (
              selectedClient.configuration?.displayName || "Client details"
            ) : hasSelection ? (
              <>
                <code className={styles.canvasCode}>{elementKey}</code>{" "}
                {isDeprecated && (
                  <Badge bg="warning" text="dark">
                    deprecated
                  </Badge>
                )}
                {isDraft && <Badge bg="info">draft</Badge>}
              </>
            ) : (
              "Clients"
            )}
          </h3>
        </div>
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
        ) : selectedClient ? (
          <ClientDetails
            client={selectedClient}
            clientUsageTotal={clientUsageTotal}
            elementKey={elementKey}
            elementLabel={elementLabel}
            copied={copied}
            onCopy={copyClientId}
            onFilter={() => onFilterClient?.(selectedClient.clientId)}
          />
        ) : (
          <>
            <div className={styles.summary} aria-live="polite">
              <small className="text-muted">
                {isLoading ? (
                  "Loading client usage…"
                ) : (
                  <>
                    {elementLabel} is used by <strong>{usedBy}</strong> client
                    {usedBy === 1 ? "" : "s"}
                  </>
                )}
              </small>
              <div>
                <small className="text-muted me-1">Total</small>
                <Badge bg="secondary">{clientUsageTotal}</Badge>
              </div>
            </div>

            <div
              className={styles.tableWrap}
              aria-busy={isLoading ? "true" : "false"}
            >
              <Table className={styles.table} responsive="md" size="sm">
                <thead>
                  <tr>
                    <th style={{ width: 48 }}>#</th>
                    <th>Client</th>
                    <th className={styles.countCol}>Usage</th>
                  </tr>
                </thead>
                <tbody className={styles.body}>
                  {clientUsage.map(
                    ({ clientId, count, configuration }, idx) => {
                      const percentage = clientUsageTotal
                        ? Math.round((count / clientUsageTotal) * 100)
                        : 0;

                      return (
                        <tr key={clientId} className={styles.result}>
                          <td>{idx + 1}</td>
                          <td>
                            <button
                              type="button"
                              className={styles.clientSelect}
                              onClick={() => setSelectedClientId(clientId)}
                              aria-label={`Show details for ${
                                configuration?.displayName || clientId
                              }`}
                            >
                              <span>
                                {configuration?.displayName && (
                                  <span className={styles.clientName}>
                                    {configuration.displayName}
                                  </span>
                                )}
                                <code className={styles.clientId}>
                                  {clientId}
                                </code>
                              </span>
                              <span className={styles.chevron}>›</span>
                            </button>
                          </td>
                          <td className={styles.countCol}>
                            <span className={styles.requestCount}>
                              <strong>{count}</strong> requests
                            </span>
                            <small className={styles.percentage}>
                              {percentage}% of usage
                            </small>
                          </td>
                        </tr>
                      );
                    }
                  )}
                </tbody>
              </Table>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
