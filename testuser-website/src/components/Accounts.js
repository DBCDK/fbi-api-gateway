import useTestUser from "@/hooks/useTestUser";
import AccountListItem from "./AccountListItem";
import AddAccount from "./AddAccount";
import styles from "./Accounts.module.css";

export function Accounts() {
  const { user, createDefaultAccounts, reset, loginAgencyId } = useTestUser();

  const accounts = user?.accounts;
  const filteredAccounts = accounts?.filter(
    (account) => account.agency.agencyId !== "190101"
  );

  return (
    <div className={styles.Accounts}>
      <h2>Brugerens konti</h2>
      {!filteredAccounts?.length && (
        <p>{user.name} er endnu ikke oprettet på noget bibliotek</p>
      )}
      {filteredAccounts?.map((account) => (
        <AccountListItem
          key={account.agency.agencyName}
          account={account}
          loginAgencyId={loginAgencyId}
        />
      ))}

      <div className={styles.Bottom}>
        <AddAccount />
        <button className={styles.Button} onClick={createDefaultAccounts}>
          Opret for mig
        </button>
        {filteredAccounts?.length > 0 && (
          <button className={styles.Button} onClick={reset}>
            Slet alle
          </button>
        )}
      </div>
    </div>
  );
}
