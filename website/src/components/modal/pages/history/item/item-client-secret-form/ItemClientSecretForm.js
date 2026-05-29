/**
 * @file Form for attaching a clientSecret to a client history entry and
 * resolving a fresh token from the server-side credential flow.
 */
import Text from "@/components/base/text";
import Button from "@/components/base/button";

import styles from "./ItemClientSecretForm.module.css";

export default function ItemClientSecretForm({
  clientSecret = "",
  clientSecretError = "",
  setClientSecret,
  showDivider = true,
  showAction = true,
  onSubmit = null,
}) {
  return (
    <>
      {showDivider && <hr className={styles.divider} />}
      <div className={styles.clientId}>
        <Text type="text4">ClientSecret</Text>
        <input
          type="password"
          value={clientSecret}
          placeholder="Enter clientSecret ..."
          onChange={(e) => setClientSecret(e.target.value)}
        />
      </div>
      {showAction && (
        <div className={styles.buttons}>
          <Button
            size="small"
            primary
            disabled={!clientSecret}
            onClick={onSubmit}
          >
            Update and use
          </Button>
        </div>
      )}
      {clientSecretError && <Text type="text1">{clientSecretError}</Text>}
    </>
  );
}
