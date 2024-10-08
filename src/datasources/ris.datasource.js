import config from "../config";

const { url, ttl } = config.datasources.openformat;

export function parseResponse(response) {
  const risArray = response?.body?.objects?.map(
    (obj) => obj?.ris?.[0]?.formatted
  );

  return risArray.join("\n");
}

async function postObject(pids, uuid) {
  const repositoryIds = pids.map((pid) => ({
    repositoryId: pid,
  }));

  return {
    formats: [
      {
        name: "ris",
        mediaType: "text/plain",
      },
    ],
    objects: repositoryIds,
    trackingId: uuid || "",
  };
}

export async function load({ pids }, context) {
  const params = await postObject(pids, context?.trackingId);

  const response = await context.fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(params),
  });

  return parseResponse(response);
}

export const options = {
  redis: {
    prefix: "ris-1",
    ttl,
  },
};
