export const itemStatusEnumMap = {
  DISCARDED: "Discarded",
  LOST: "Lost",
  NOTFORLOAN: "NotForLoan",
  ONLOAN: "OnLoan",
  ONORDER: "OnOrder",
  ONSHELF: "OnShelf",
};

export function checkUserRights(user) {
  const loggedInAgencyId = user?.loggedInAgencyId;
  const dbcidp = user?.dbcidp;

  // Missing agencyId for provided user token (e.g. nemlogin)
  if (!loggedInAgencyId) {
    return {
      ok: false,
      status: "ERROR_INVALID_AGENCY",
      message:
        "Invalid token: Missing agencyId. Ensure your login method provides an agencyId.",
    };
  }

  // check that user has correct idp rights
  const rights = dbcidp?.find(
    (obj) => obj?.agencyId === loggedInAgencyId
  )?.rights;

  // holdingsupdate write access
  const hasWriteAccess = !!rights?.find(
    (obj) => obj.productName === "HOLDINGSUPDATE" && obj.name === "WRITE"
  );

  // Missing agencyId for provided user token
  if (!hasWriteAccess) {
    return {
      ok: false,
      status: "ERROR_NO_AUTHORISATION",
      message: "Access denied: You do not have the required permissions.",
    };
  }

  return { ok: true };
}
