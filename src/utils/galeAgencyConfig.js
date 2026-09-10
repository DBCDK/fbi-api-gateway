import galeAgencyConfig from "./galeAgencyConfig.json";

export const GALE_AGENCY_CONFIG = galeAgencyConfig;

export function getGaleAgencyConfig(agencyId) {
  if (!agencyId) {
    return null;
  }

  return GALE_AGENCY_CONFIG[agencyId] ?? null;
}
