import config from "../config";

const { url, ttl } = config.datasources.openformat;

async function postObject(pids) {
  const repositoryIds = pids.map((pid) => ({
    repositoryId: pid,
  }));

  return {
    formats: [
      {
        name: "refWorks",
        mediaType: "text/plain",
      },
    ],
    objects: repositoryIds,
    trackingId: "some-uuid",
  };
}

export function parseResponse(response) {
  console.log(JSON.stringify(response, null, 4), "REEEEEEEEEEEEEEEEEESPONSE");

  const refWorksArray = response?.body?.objects?.map(
    (obj) => obj?.refWorks?.[0]?.formatted
  );

  console.log(
    JSON.stringify(refWorksArray, null, 4),
    "ARRRRRRRRRRRRAUYYYYYYYYYY"
  );

  return refWorksArray.join("\n");
}

export async function load({ pids }, context) {
  const params = await postObject(pids);
  const response = await context.fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(params),
  });

  return parseResponse(response);
}

// export const options = {
//   redis: {
//     prefix: "refworks-1",
//     ttl,
//     staleWhileRevalidate: 60 * 60 * 24 * 30, // 30 days
//   },
// };
