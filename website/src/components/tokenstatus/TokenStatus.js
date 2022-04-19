import useConfiguration from "@/hooks/useConfiguration";
import useStorage from "@/hooks/useStorage";
import History from "@/components/history";

import styles from "./TokenStatus.module.css";

/**
 * A component indicating the client, profile, and agency
 * of the selected token.
 *
 * @returns {component}
 */
export default function TokenStatus() {
  const { selectedToken } = useStorage();
  const { configuration, isLoading: configurationIsLoading } = useConfiguration(
    selectedToken
  );
  const isLoading = selectedToken && configurationIsLoading;

  let content;
  if (!selectedToken) {
    content = <span>Configure Access</span>;
  } else if (isLoading) {
    content = <span>Loading</span>;
  } else if (configuration) {
    content = (
      <>
        <span>{configuration?.displayName}</span> |
        <span>{selectedToken?.agency}</span> |
        <span>{selectedToken?.profile}</span>
      </>
    );
  } else {
    content = <span>Configure Access</span>;
  }
  return (
    <div className={styles.tokenstatus}>
      {content}

      <History className={styles.history} compact />
    </div>
  );
}
