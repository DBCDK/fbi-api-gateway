import config from "../config";

const { enabled } = config.datasources.statsbiblioteket;

export async function load(_key, context) {
  if (!enabled) {
    return {};
  }
  const res = await context?.fetch(
    `${config.datasources.statsbiblioteket.url}/copydanws/subscribers`,
    {
      headers: { Accept: "application/json" },
      enableProxy: true,
      timeoutMs: 20000,
    }
  );

  const body = res.body;

  const subscriberMap = body.subscribers.subscriber.reduce(
    (map, subscriber) => {
      map[subscriber.isil.replace(/\D/g, "")] = 1;
      return map;
    },
    {}
  );

  return subscriberMap;
}

export const options = {
  external: true,
  redis: {
    prefix: "statsbiblioteketSubs2",
    ttl: 60 * 60,
    staleWhileRevalidate: 60 * 60 * 24 * 30, // 30 days
    inMemory: true,
  },
};
