import config from "../config";

const { prefix, ttl, teamLabel } = config.datasources.authAdmin;

export async function load(clientId, context) {
  const { url, user, password } = config.datasources.authAdmin;
  if (!clientId) return null;
  if (!user || !password) {
    const error = new Error("Auth Admin credentials are not configured");
    error.code = "AUTH_ADMIN_NOT_CONFIGURED";
    throw error;
  }

  const auth = Buffer.from(`${user}:${password}`).toString("base64");
  const endpoint = `${url.replace(/\/$/, "")}/clients/${encodeURIComponent(
    clientId
  )}`;
  const response = await context.fetch(endpoint, {
    method: "GET",
    headers: {
      Accept: "application/json",
      Authorization: `Basic ${auth}`,
    },
    allowedErrorStatusCodes: [404],
  });

  if (response?.status === 404) return null;
  if (!response?.ok) {
    const error = new Error(
      `Auth Admin client lookup failed: ${response?.status || "UNKNOWN"}`
    );
    error.status = response?.status;
    throw error;
  }

  return response.body;
}

export const options = {
  redis: {
    prefix,
    ttl,
  },
};

export { teamLabel };
