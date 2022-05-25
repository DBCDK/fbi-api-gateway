import { log } from "dbc-node-logger";
import Redis from "ioredis";
import config from "../config";
import monitor from "../utils/monitor";

// Redis client
let redis;

// Variable indicating if we are connected
let isConnected = false;

const localStore = {};

/**
 * Connect to a Redis server and create event handlers
 *
 * @param {Object} params The params object
 * @param {string} params.host The Redis host
 * @param {number|string} params.port The Redis port
 * @param {string} params.prefix The Redis prefix
 */
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

/**
 * A monitored redis get operation
 */
export const get = monitor(
  { name: "REQUEST_redis_get", help: "Redis get request" },
  async (key, inMemory) => {
    try {
      let parsed;
      if (inMemory && localStore[key]) {
        parsed = localStore[key];
      } else {
        parsed = JSON.parse(await redis.get(key));
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
    }
  }
);

/**
 * A monitored redis set operation
 */
export const set = monitor(
  { name: "REQUEST_redis_set", help: "Redis set request" },
  async (key, seconds, val, inMemory) => {
    try {
      const obj = { _redis_stored: Date.now(), val };
      if (inMemory) {
        localStore[key] = obj;
      }
      await redis.set(key, JSON.stringify(obj), "ex", seconds);
    } catch (e) {
      log.error(`Redis setex failed`, {
        key,
        val,
        seconds,
      });
    }
  }
);

/**
 * A monitored redis delete operation
 */
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

/**
 * mget does not work when Redis is running in a cluster
 * and keys are on different nodes.
 * Therefore, we must call get per key.
 *
 * @param {string} keys The keys to fetch
 */
async function mget(keys, inMemory) {
  if (!isConnected) {
    return keys.map(() => null);
  }
  return Promise.all(keys.map((key) => get(key, inMemory)));
}

/**
 * Wrap the Redis setex function in a Promise.
 * The promise will always resolve - never reject.
 * In case of failure, we log and move on.
 *
 * @param {string} key The key
 * @param {number} seconds Time to live in seconds
 * @param {Object} val The value to store
 */
async function setex(key, seconds, val, inMemory) {
  if (!isConnected) {
    return;
  }

  await set(key, seconds, val, inMemory);
}

function createPrefixedKey(prefix, key) {
  if (typeof key === "object") {
    return `${prefix}_${JSON.stringify(key)}`;
  }
  return `${prefix}_${key}`;
}

/**
 * A higher order function, that makes it easy to enhance
 * a batch loader with Redis caching capabilities.
 *
 * @param {function} batchFunc a DataLoader batch function
 * @param {Object} options The options object
 * @param {string} options.prefix Prefix to put on each keys
 * @param {number} options.ttl Time to live in seconds
 * @param {number} options.staleWhileRevalidate seconds to allow values to be stale
 * @param {function} options.setex Inject setex function (for testing)
 * @param {function} options.mget Inject mget function (for testing)
 *
 * @returns {function} A Redis enhanced batch function
 */
export function withRedis(
  batchFunc,
  {
    prefix = "",
    ttl = 60,
    staleWhileRevalidate,
    setexFunc = setex,
    mgetFunc = mget,
    inMemory = false,
  }
) {
  /**
   * This is a DataLoader batch function
   * It fetches as many keys from Redis as possible.
   * The rest will be fetched via the batchFunc that
   * is given to the outer function.
   * Finally, missing values are sent to Redis
   *
   * @param {Array.<string>} keys The keys to fetch
   */
  async function redisBatchLoader(keys, track) {
    const now = Date.now();

    // Create array of prefixed keys
    const prefixedKeys = keys.map((key) => createPrefixedKey(prefix, key));

    // Get values of all prefixed keys from Redis
    const cachedValues = await mgetFunc(prefixedKeys, inMemory);
    track.track("redis", Date.now() - now, keys.length);

    // If some values were not found in Redis,
    // they are added to missing keys array
    // If they are stale, they are added to staleKeys array
    const missingKeys = [];
    const staleKeys = [];
    cachedValues.forEach((val, idx) => {
      if (!val) {
        missingKeys.push(keys[idx]);
      } else if (now - val._redis_stored > ttl * 1000) {
        staleKeys.push(keys[idx]);
      }
    });

    // Fetch missing values using the provided batch function
    let values;
    if (missingKeys.length > 0) {
      values = await batchFunc(missingKeys);

      // Store those missing values in Redis with expiration time set to ttl
      // We do not await here
      missingKeys.forEach((key, idx) => {
        if (!(values[idx] instanceof Error)) {
          return setexFunc(
            createPrefixedKey(prefix, key),
            staleWhileRevalidate || ttl,
            values[idx],
            inMemory
          );
        }
      });
    }

    // Refresh stale values, we don't await
    (async () => {
      if (staleKeys.length > 0) {
        const refreshedValues = await batchFunc(staleKeys);
        staleKeys.forEach((key, idx) => {
          if (!(refreshedValues[idx] instanceof Error)) {
            return setexFunc(
              createPrefixedKey(prefix, key),
              staleWhileRevalidate || ttl,
              refreshedValues[idx],
              inMemory
            );
          }
        });
      }
    })();

    // Return array of values
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

/**
 * The status function
 *
 * @throws Will throw error if service is down
 */
export function status() {
  if (!isConnected) {
    throw new Error("Redis is not connected");
  }
}

// Connect if Redis is enabled
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
