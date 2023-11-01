import { useMemo, useState } from "react";

import useTestUser from "@/hooks/useTestUser";
import useData from "../hooks/useData";

import styles from "./AddAccount.module.css";

export default function AddAccount() {
  const [value, setValue] = useState("");
  const { data } = useData(
    value && {
      query: `query($q: String) {
    branches(q: $q, agencyTypes: [FOLKEBIBLIOTEK, FORSKNINGSBIBLIOTEK, SKOLEBIBLIOTEK], limit: 50) {
      hitcount
      result {
        name
        agencyName
        agencyId
        agencyType
        highlights {
          key
          value
        }
      }
    }
  }
  
  `,
      variables: { q: value },
    }
  );
  const { addAccount, user } = useTestUser();

  const uniqueAgencies = useMemo(() => {
    const agencies = [];
    data?.branches?.result?.forEach((branch) => {
      // exclude existing agencies
      if (
        user?.accounts?.find(
          (account) => account.agency.agencyId === branch.agencyId
        )
      ) {
        return;
      }
      let agency = agencies.find(
        (agency) => agency.agencyId === branch.agencyId
      );
      if (!agency) {
        agency = { ...branch, branches: [] };
        agencies.push(agency);
      }
      agency.branches.push(branch);
    });
    return agencies.slice(0, 10);
  }, [data?.branches?.result, user?.accounts]);

  return (
    <div className={styles.AddAccount}>
      <div>Tilføj konto</div>
      <input
        type="text"
        value={value}
        placeholder="Indtast biblioteksvæsen"
        onChange={(e) => setValue(e.target.value)}
      />
      {uniqueAgencies?.length > 0 && (
        <div className={styles.AccountDropdown}>
          {uniqueAgencies?.map((agency) => {
            return (
              <div key={agency.agencyId}>
                <button
                  onClick={() => {
                    addAccount(
                      agency.agencyId,
                      agency.agencyType === "FOLKEBIBLIOTEK"
                        ? "0101011234"
                        : null
                    );
                    setValue("");
                  }}
                >
                  {agency.agencyName}
                </button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
