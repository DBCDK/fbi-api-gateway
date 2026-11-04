/**
 * @file API route for reporting the actual request network classification used
 * to decide whether the local-network override setting should be visible.
 */
import {
  getRequestIp,
  isInternalRequest,
} from "../../../lib/credentialProviders";

export default function handler(req, res) {
  const isInternal = isInternalRequest(req, {
    ignoreDisableOverride: true,
  });
  const localHost = req.headers?.host?.match(
    /^(localhost|127\.0\.0\.1|\[::1\])(?::\d+)?$/i
  )?.[1];
  const monitoringBaseUrl =
    process.env.INTERNAL_MONITORING_URL ||
    (localHost ? `http://${localHost}:9599` : null);
  res.setHeader("Cache-Control", "private, no-store");
  return res.status(200).send({
    detectedIp: getRequestIp(req),
    isInternal,
    monitoringBaseUrl: isInternal ? monitoringBaseUrl : null,
  });
}
