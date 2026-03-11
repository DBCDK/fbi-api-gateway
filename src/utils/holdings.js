export const itemStatusEnumMap = {
  DISCARDED: "Discarded",
  LOST: "Lost",
  NOTFORLOAN: "NotForLoan",
  ONLOAN: "OnLoan",
  ONORDER: "OnOrder",
  ONSHELF: "OnShelf",
};

export function checkUserRights(user) {
  const idpRights = user?.dbcidp;

  // holdingsupdate write access
  const hasWriteAccess = !!idpRights?.find(
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
