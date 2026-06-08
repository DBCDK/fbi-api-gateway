/**
 * @file Form for attaching a refresh token to a credential application entry when
 * the client supports refresh-token based renewal.
 */
import Text from "@/components/base/text";

import styles from "./ItemRefreshTokenForm.module.css";

export default function ItemRefreshTokenForm({
  refreshToken = "",
  refreshTokenError = "",
  setRefreshToken,
}) {
  return (
    <>
      <hr className={styles.divider} />
      <div className={styles.refreshToken}>
        <Text type="text4">Refresh token</Text>
        <div className={styles.fieldRow}>
          <span className={styles.fieldIcon} aria-hidden="true">
            ♻️
          </span>
          <input
            type="password"
            className={styles.fieldInput}
            value={refreshToken}
            placeholder="Enter refresh token ..."
            onChange={(e) => setRefreshToken(e.target.value)}
          />
        </div>
      </div>
      {refreshTokenError && (
        <Text className={styles.error} type="text1">
          {refreshTokenError}
        </Text>
      )}
    </>
  );
}
