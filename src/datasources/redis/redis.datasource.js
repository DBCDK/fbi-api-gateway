import { log } from "dbc-node-logger";
import Redis from "ioredis";
import config from "../../config";
import { parseJSON, stringifyJSON } from "../../utils/json";
import monitor from "../../utils/monitor";

const { teamLabel } = config.datasources.redis;
let redis;
let isConnected = false;

const localStore = {};

function connectRedis({ host, port, prefix }) {
  log.info(`Connecting to Redis`, {
    redisHost: host,
    redisPort: port,
    redisPrefix: prefix,
  });
  redis = new Redis.Cluster([{ host, port }], { keyPrefix: prefix });

  redis.on("ready", function () {
    isConnected = true;
    log.info(`Connected to Redis`, {
      redisHost: host,
      redisPort: port,
      redisPrefix: prefix,
    });
  });

  redis.on("close", function () {
    if (!isConnected) {
      return;
    }
    isConnected = false;
    log.error(`Disconnected from Redis`, {
      redisHost: host,
      redisPort: port,
      redisPrefix: prefix,
    });
  });

  redis.on("error", function (error) {
    if (!isConnected) {
      return;
    }
    log.error(`Some Redis error occured: ${error.message}`, {
      redisHost: host,
      redisPort: port,
      redisPrefix: prefix,
    });
  });
}

export const get = monitor(
  { name: "REQUEST_redis_get", help: "Redis get request" },
  async (key, inMemory, stats, datasourceName) => {
    const timings = { redisTime: 0, bytes: 0 };
    try {
      let parsed;
      if (inMemory && localStore[key]) {
        parsed = localStore[key];
      } else {
        const now = performance.now();
        const str = await redis.get(key);
        const buf = str && Buffer.from(str);
        timings.redisTime = performance.now() - now;
        timings.bytes = buf?.byteLength;

        parsed = await parseJSON(str, timings);

        if (inMemory) {
          localStore[key] = parsed;
        }
      }
      return parsed;
    } catch (e) {
      log.error(`Redis get failed`, {
        key,
      });
      return null;
    } finally {
      stats?.addRedisGet(datasourceName, timings);
    }
  }
);

export const set = monitor(
  { name: "REQUEST_redis_set", help: "Redis set request" },
  async (key, seconds, val, inMemory, stats, datasourceName) => {
    const timings = { redisTime: 0 };
    try {
      const obj = { _redis_stored: Date.now(), val };
      if (inMemory) {
        localStore[key] = obj;
      }
      const str = await stringifyJSON(obj, timings);
      const now = performance.now();
      await redis.set(key, str, "EX", seconds);
      timings.redisTime += performance.now() - now;
    } catch (e) {
      log.error(`Redis setex failed`, {
        key,
        val,
        seconds,
      });
    } finally {
      stats?.addRedisSet(datasourceName, timings);
    }
  }
);

export const incr = monitor(
  { name: "REQUEST_redis_incr", help: "Redis increment request" },
  async (key, seconds, stats, datasourceName) => {
    const timings = { redisTime: 0 };

    if (!isConnected) {
      return null;
    }

    try {
      const now = performance.now();
      const count = await redis.incr(key);
      await redis.expire(key, seconds, "NX");
      timings.redisTime = performance.now() - now;

      return count;
    } catch (e) {
      log.error(`Redis INCR failed`, { key });
      return null;
    } finally {
      stats?.addRedisSet(datasourceName, timings);
    }
  }
);

export const del = monitor(
  { name: "REQUEST_redis_del", help: "Redis del (delete) request" },
  async (key) => {
    try {
      await redis.del(key);
    } catch (e) {
      log.error(`Redis delete failed`, {
        key,
      });
    }
  }
);

async function mget(keys, inMemory, stats, datasourceName) {
  if (!isConnected) {
    return keys.map(() => null);
  }

  return Promise.all(
    keys.map((key) => get(key, inMemory, stats, datasourceName))
  );
}

async function setex(key, seconds, val, inMemory, stats, datasourceName) {
  if (!isConnected) {
    return;
  }

  await set(key, seconds, val, inMemory, stats, datasourceName);
}

function createPrefixedKey(prefix, key) {
  if (typeof key === "object") {
    return `${prefix}_${JSON.stringify(key)}`;
  }
  return `${prefix}_${key}`;
}

export function withRedis(
  batchFunc,
  {
    prefix = "",
    ttl = 60,
    staleWhileRevalidate,
    setexFunc = setex,
    mgetFunc = mget,
    inMemory = false,
    track,
    datasourceName,
    stats,
  }
) {
  async function redisBatchLoader(keys) {
    const now = Date.now();
    const prefixedKeys = keys.map((key) => createPrefixedKey(prefix, key));
    const cachedValues = await mgetFunc(
      prefixedKeys,
      inMemory,
      stats,
      datasourceName
    );

    const missingKeys = [];
    const staleKeys = [];
    cachedValues.forEach((val, idx) => {
      if (!val) {
        missingKeys.push(keys[idx]);
      } else if (now - val._redis_stored > ttl * 1000) {
        staleKeys.push(keys[idx]);
      }
    });

    stats?.incrementRedisLookups(datasourceName, keys.length);
    stats?.incrementRedisHits(
      datasourceName,
      keys.length - missingKeys.length - staleKeys.length
    );

    let values;
    if (missingKeys.length > 0) {
      values = await batchFunc(missingKeys);

      missingKeys.forEach((key, idx) => {
        if (!(values[idx] instanceof Error)) {
          return setexFunc(
            createPrefixedKey(prefix, key),
            staleWhileRevalidate || ttl,
            values[idx],
            inMemory,
            stats,
            datasourceName
          );
        }
      });
    }

    (async () => {
      if (staleKeys.length > 0) {
        const refreshedValues = await batchFunc(staleKeys);
        staleKeys.forEach((key, idx) => {
          if (
            refreshedValues?.[idx] &&
            !(refreshedValues[idx] instanceof Error)
          ) {
            return setexFunc(
              createPrefixedKey(prefix, key),
              staleWhileRevalidate || ttl,
              refreshedValues[idx],
              inMemory,
              stats,
              datasourceName
            );
          }
        });
      }
    })();

    const res = keys.map((key, idx) => {
      if (cachedValues[idx]) {
        return cachedValues[idx].val;
      }
      return values.shift();
    });
    return res;
  }

  return redisBatchLoader;
}

export async function clearRedis(prefix, key) {
  const prefixedKey = createPrefixedKey(prefix, key);
  await redis.del(prefixedKey);
}

export function status() {
  if (!isConnected) {
    throw new Error("Redis is not connected");
  }
}

if (
  config.datasources.redis.enabled === true ||
  config.datasources.redis.enabled === "true"
) {
  connectRedis({
    host: config.datasources.redis.host,
    port: config.datasources.redis.port,
    prefix: config.datasources.redis.prefix,
  });
}

export { teamLabel };
