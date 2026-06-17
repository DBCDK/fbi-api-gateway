import config from "../config";

const { url, token, ttl, prefix, teamLabel } = config.datasources.retriever;
const searchPath = "/public-api/customer-api/articles/search";
const searchUrl = `${url.replace(/\/$/, "")}${searchPath}`;

export async function load({ docId }, context) {
  if (!token) {
    return { error: "MISSING_RETRIEVER_TOKEN" };
  }

  const response = await context.fetch(searchUrl, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ formatFulltextHtml: true, query: `docID:"${docId}"` }),
    allowedErrorStatusCodes: [400, 401, 403, 404],
  });

  if (response.status !== 200) {
    return {
      error: "RETRIEVER_REQUEST_FAILED",
      status: response.status,
      body: response.body,
    };
  }

  return response.body?.documents?.[0];
}

export const options = {
  redis: {
    prefix,
    ttl,
  },
};

export { teamLabel };
