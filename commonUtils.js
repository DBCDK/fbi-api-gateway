import permissions from "./src/permissions.json";
export function parseClientPermissions({ smaug }) {
  return smaug?.gateway?.role
    ? permissions[smaug?.gateway?.role]
    : smaug?.gateway || permissions.default;
}
