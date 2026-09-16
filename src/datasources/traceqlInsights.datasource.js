import config from "../config";

const { url, timeoutMs, teamLabel } = config.datasources.traceql;

export async function load({ path, params = {} }, context) {
  const endpoint = new URL(path, `${url}/`);
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== "") {
      endpoint.searchParams.set(key, String(value));
    }
  });

  const response = await context.fetch(endpoint.toString(), {
    method: "GET",
    headers: {
      Accept: "application/json",
      Authorization: `Bearer ${context.accessToken}`,
    },
    timeoutMs,
    allowedErrorStatusCodes: [400, 401, 403, 500, 503],
  });

  if (!response?.ok) {
    const code = response?.body?.code || response?.status || "UNKNOWN";
    const error = new Error(`TraceQL Insights request failed: ${code}`);
    error.status = response?.status;
    error.code = code;
    error.earliestAvailableAt = response?.body?.earliestAvailableAt;
    throw error;
  }

  return response.body;
}

export { teamLabel };
