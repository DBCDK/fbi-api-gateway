import permissions from "./src/permissions";

const IDP_SYSTEM_USER_ACCESS = "idpsystemuser";

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

/**
 * Returns true for anonymous users with idp system access.
 * An anonymous user is logged in via the `client_credentials` Oauth grant (system to system user)
 */
export function getIsIdpSystemUser({ smaug, user }) {
  const isAnonymous = !user?.id;
  return isAnonymous && smaug?.access?.includes(IDP_SYSTEM_USER_ACCESS);
}
