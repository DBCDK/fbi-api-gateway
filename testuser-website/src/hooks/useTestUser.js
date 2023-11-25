import useAccessToken from "./useAccessToken";
import useData from "./useData";
import config from "@/config";
import { useRouter } from "next/router";

const DEFAULT_TEMPLATE = {
  accounts: [
    { agency: { agencyId: "790900" }, cpr: "0101011234" },
    { agency: { agencyId: "715100" }, cpr: "0101011234", isMunicipality: true },
    {
      agency: { agencyId: "716300" },
      cpr: "0101011234",
      blocked: true,
      debt: "1500",
    },
    {
      agency: { agencyId: "800010" },
    },
  ],
};

export default function useTestUser() {
  const router = useRouter();
  const { accessToken, seed } = useAccessToken();
  const testUserToken = accessToken;
  const loginAgencyId = router?.query?.agency || "190101";

  const res = useData(
    seed && {
      query: `query {
        user {
          name
        }
        test {
          user {
            accounts {
              agency {
                agencyName
                agencyId
                agencyType
              }
              cpr
              debt
              uniqueId
              blocked
              isMunicipality
            }
          }
        }
      }`,
    }
  );

  const user = {
    ...res?.data?.user,
    ...res?.data?.test?.user,
  };

  async function update(input) {
    const parsed = {
      accounts: input?.accounts.map((reg) => {
        return {
          agency: reg.agency.agencyId,
          cpr: reg.cpr,
          debt: reg.debt,
          blocked: reg.blocked,
          isMunicipality: reg.isMunicipality,
        };
      }),
    };

    res.mutate(
      { data: { ...res?.data, test: { user: input } } },
      {
        revalidate: false,
      }
    );

    await fetch(config.fbiApiUrl, {
      method: "post",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${testUserToken}`,
      },
      body: JSON.stringify({
        query: `mutation MutateTestUser ($input: TestUserInput!) {
                test {
                  user(input: $input)
                }
              }`,
        variables: { input: parsed },
      }),
    });
    res.mutate();
  }

  function createDefaultAccounts() {
    update(DEFAULT_TEMPLATE);
  }
  function reset() {
    update({ accounts: [] });
  }

  function deleteAccount(agencyId) {
    const updatedUser = {
      accounts: user?.accounts.filter(
        (account) => account.agency.agencyId !== agencyId
      ),
    };

    update(updatedUser);
  }

  async function addAccount(agencyId, cpr) {
    if (
      user?.accounts?.find((account) => account.agency.agencyId === agencyId)
    ) {
      return;
    }
    const account = {
      agency: { agencyId },
      cpr,
    };

    const updatedUser = {
      accounts: [...user?.accounts, account],
    };

    await update(updatedUser);
  }

  async function updateAccount(updatedAccount) {
    const updatedUser = {
      accounts: user?.accounts.map((account) =>
        account.agency.agencyId === updatedAccount.agency.agencyId
          ? updatedAccount
          : account
      ),
    };

    update(updatedUser);
  }

  const loginAccount = user?.accounts?.find(
    (account) => account.agency.agencyId === loginAgencyId
  );

  const loginAgencyName =
    loginAgencyId === "190101" ? "MitID" : loginAccount?.agency?.agencyName;
  return {
    user,
    update,
    updateAccount,
    deleteAccount,
    addAccount,
    createDefaultAccounts,
    reset,
    testUserToken,
    loginAccount,
    loginAgencyId,
    loginAgencyName,
  };
}
