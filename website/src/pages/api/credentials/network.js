/**
 * @file API route for reporting the actual request network classification used
 * to decide whether the local-network override setting should be visible.
 */
import { getRequestIp, isInternalRequest } from "../../../lib/credentialProviders";

export default function handler(req, res) {
  return res.status(200).send({
    detectedIp: getRequestIp(req),
    isInternal: isInternalRequest(req, {
      ignoreDisableOverride: true,
    }),
  });
}
