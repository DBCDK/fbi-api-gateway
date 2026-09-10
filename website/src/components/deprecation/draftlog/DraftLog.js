import Table from "react-bootstrap/Table";

import styles from "../changelog/Changelog.module.css";
import useSchema from "@/hooks/useSchema";
import useSelectedCredential from "@/hooks/credentials/useSelectedCredential";
import Text from "@/components/base/text";
import Spinner from "@/components/base/spinner/Spinner";
import { getDraftLogEntries } from "../logUtils";

export default function DraftLog() {
  const { selectedCredential: selectedToken } = useSelectedCredential();
  const { json, isLoading } = useSchema(selectedToken);

  const data = getDraftLogEntries(json);

  if (!data.length && isLoading) {
    return (
      <Text>
        ... Searching for draft fields <Spinner className={styles.spinner} />
      </Text>
    );
  }

  if (!data.length && !selectedToken?.token && !isLoading) {
    return <Text>... Provide a token to watch the draft log 🔑</Text>;
  }

  if (!data.length && !isLoading) {
    return <Text>... Currently no draft fields 🤸</Text>;
  }

  return (
    <Table className={styles.table} responsive="md">
      <thead>
        <tr>
          <th>#</th>
          <th>Path</th>
          <th>Details</th>
        </tr>
      </thead>

      <tbody className={styles.body}>
        {data.map((entry, idx) => (
          <tr key={`draft-${entry.type}-${entry.field}-${idx}`}>
            <td>{idx + 1}</td>
            <td>
              <strong>{entry.type}</strong>
              <span>.{entry.field}</span>
              {entry.argument && (
                <span>
                  <span>argument</span>
                  <i>{entry.argument}</i>
                </span>
              )}
            </td>
            <td>{entry.details || "This field is available as draft."}</td>
          </tr>
        ))}
      </tbody>
    </Table>
  );
}
