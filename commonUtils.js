import permissions from "./src/permissions";

export function parseClientPermissions({ smaug }) {
  if (smaug?.gateway?.role && permissions[smaug?.gateway?.role]) {
    return permissions[smaug?.gateway?.role];
  }
  if (smaug?.gateway?.admin) {
    return { admin: true };
  }
  if (smaug?.gateway?.allowRootFields) {
    return smaug?.gateway;
  }
  return permissions.default;
}

export function getIsIdpSystemUser({ smaug, user }) {
  const isAnonymous = !user?.id;
  return isAnonymous && smaug?.access?.includes("idpsystemuser");
}
