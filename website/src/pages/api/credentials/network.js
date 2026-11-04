/**
 * @file API route for reporting the actual request network classification used
 * to decide whether the local-network override setting should be visible.
 */
import config from "../../../../../src/config.js";
import {
  getRequestIp,
  isInternalRequest,
} from "../../../lib/credentialProviders";

export default function handler(req, res) {
  const isInternal = isInternalRequest(req, {
    ignoreDisableOverride: true,
  });
  res.setHeader("Cache-Control", "private, no-store");
  return res.status(200).send({
    detectedIp: getRequestIp(req),
    isInternal,
    monitoringBaseUrl: isInternal ? config.monitoring.url : null,
  });
}
