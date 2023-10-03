const config = {
  clientId: "some-clientId",
  user: {
    id: "some-id",
    agency: "some-agency",
  },
};

export async function load({ accessToken }) {
  if (accessToken === "FFU_AUTHENTICATED_TOKEN") {
    return { ...config, user: { id: "C000000002", agency: "800002" } };
  }

  if (accessToken === "FOLK_UNAUTHENTICATED_TOKEN") {
    return { ...config, user: null };
  }

  if (accessToken === "FOLK_AUTHENTICATED_TOKEN") {
    return { ...config, user: { id: "0102033692", agency: "790900" } };
  }

  if (accessToken === "FOLK_MISMATCH_CPR_TOKEN") {
    return { ...config, user: { id: "0102033690", agency: "790900" } };
  }

  if (accessToken === "AUTHENTICATED_TOKEN") {
    return { ...config, user: { id: "0102033692", agency: "790900" } };
  }

  if (accessToken === "FOLK_AUTHENTICATED_TOKEN_SUCCES") {
    return { ...config, user: { id: "0102033690", agency: "790900" } };
  }

  if (accessToken === "AUTHENTICATED_TOKEN_SUCCES") {
    return { ...config, user: { id: "0102033690", agency: "790900" } };
  }

  if (accessToken === "AUTHENTICATED_TOKEN_NO_ACCOUNTS") {
    return { ...config, user: { id: "0102033691", agency: "790900" } };
  }

  return {};
}
