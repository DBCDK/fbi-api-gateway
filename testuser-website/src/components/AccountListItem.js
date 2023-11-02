import useTestUser from "@/hooks/useTestUser";
import styles from "./AccountListItem.module.css";

export default function AccountListItem({ account, loginAgencyId }) {
  const { updateAccount, deleteAccount } = useTestUser();
  const isAgency = account.agency.agencyId !== "190101";
  const isLoginAgency = account.agency.agencyId === loginAgencyId;
  return (
    <div key={account.agency.agencyName} className={styles.Item}>
      <div className={styles.Top}>
        <div>
          <h3>{account.agency.agencyName}</h3>
          <div className={styles.AgencyType}>{account.agency.agencyType}</div>
        </div>
        {!isLoginAgency && (
          <button onClick={() => deleteAccount(account.agency.agencyId)}>
            slet
          </button>
        )}
      </div>
      {isAgency && (
        <>
          <label>
            <div>Blokeret</div>
            <input
              type="checkbox"
              checked={account.blocked}
              onChange={async (e) => {
                await updateAccount({
                  ...account,
                  blocked: !!e.target.checked,
                });
              }}
            />
          </label>

          <label>
            <div>Gæld</div>
            <input
              type="text"
              value={account.debt}
              onChange={async (e) => {
                await updateAccount({
                  ...account,
                  debt: e.target.value,
                });
              }}
            />
          </label>
        </>
      )}
      <label>
        <div>Sammenkoblet med CPR</div>
        <input
          type="checkbox"
          checked={!!account.cpr}
          onChange={async (e) => {
            await updateAccount({
              ...account,
              cpr: e.target.checked ? "0101011234" : null,
            });
          }}
        />
      </label>
      <label>
        <div>Bopæl</div>
        <input
          type="checkbox"
          checked={!!account.isMunicipality}
          onChange={async (e) => {
            await updateAccount({
              ...account,
              isMunicipality: !!e.target.checked,
            });
          }}
        />
      </label>
    </div>
  );
}
