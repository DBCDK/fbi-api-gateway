import config from "../config";

const { url, timeoutMs, teamLabel } = config.datasources.traceql;

export async function load(event, context) {
  return context.fetch(`${url}/v1/usage`, {
    method: "POST",
    headers: {
      Accept: "application/json",
      Authorization: `Bearer ${context.accessToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(event),
    timeoutMs,
    allowedErrorStatusCodes: [400, 401, 413, 500, 503],
  });
}

export { teamLabel };
