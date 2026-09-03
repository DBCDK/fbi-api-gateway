import { log } from "dbc-node-logger";
import config from "../../config";
import { parseJSON, stringifyJSON } from "../../utils/json";
import monitor from "../../utils/monitor";
import { createRedisConnection } from "./index";

const { teamLabel } = config.datasources.redis;
const localStore = {};
const connection = createRedisConnection({
  host: config.datasources.redis.host,
  port: config.datasources.redis.port,
  prefix: config.datasources.redis.prefix,
  messages: {
    connecting: "Connecting to Redis",
    connected: "Connected to Redis",
    disconnected: "Disconnected from Redis",
    errorPrefix: "Some Redis error occured",
  },
});

/**
 * A monitored redis get operation
 */
export const get = monitor(
  { name: "REQUEST_redis_get", help: "Redis get request" },
  async (key, inMemory, stats, datasourceName) => {
    const timings = { redisTime: 0, bytes: 0 };
    try {
      let parsed;
      if (inMemory && localStore[key]) {
        parsed = localStore[key];
      } else {
        const redis = connection.getRedis();
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

/**
 * A monitored redis set operation
 */
export const set = monitor(
  { name: "REQUEST_redis_set", help: "Redis set request" },
  async (key, seconds, val, inMemory, stats, datasourceName) => {
    const timings = { redisTime: 0 };
    try {
      const redis = connection.getRedis();
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

/**
 * A monitored Redis increment operation
 */
export const incr = monitor(
  { name: "REQUEST_redis_incr", help: "Redis increment request" },
  async (key, seconds, stats, datasourceName) => {
    const timings = { redisTime: 0 };

    // Rate limiting must fail open while Redis is disconnected. Otherwise
    // ioredis queues the command until reconnect and the GraphQL request hangs.
    if (!connection.isConnected()) {
      return null;
    }

    try {
      const redis = connection.getRedis();
      const now = performance.now();
      const count = await redis.incr(key);

      // Ensure the counter key always has a TTL:
      // - Fixes rare cases where a key ended up without expiry (would count forever).
      // - "NX" means: only set expiry if the key has no expiry already.
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

/**
 * A monitored redis delete operation
 */
export const del = monitor(
  { name: "REQUEST_redis_del", help: "Redis del (delete) request" },
  async (key) => {
    try {
      const redis = connection.getRedis();
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
async function mget(keys, inMemory, stats, datasourceName) {
  if (!connection.isConnected()) {
    return keys.map(() => null);
  }

  return Promise.all(
    keys.map((key) => get(key, inMemory, stats, datasourceName))
  );
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
async function setex(key, seconds, val, inMemory, stats, datasourceName) {
  if (!connection.isConnected()) {
    return;
  }

  await set(key, seconds, val, inMemory, stats, datasourceName);
}

/**
 * Try to become the one FBI-API instance responsible for filling a cache key.
 * The lock expires in Redis, so a crashed instance cannot block later requests.
 */
async function acquireLock({ key, ttlMs }) {
  if (!connection.isConnected()) {
    return null;
  }

  try {
    const redis = connection.getRedis();
    const result = await redis.set(`${key}:lock`, "1", "PX", ttlMs, "NX");
    return result === "OK";
  } catch (e) {
    log.error("Redis cache lock failed", { key });
    return null;
  }
}

const sleep = (milliseconds) =>
  new Promise((resolve) => setTimeout(resolve, milliseconds));

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
 * @param {boolean|Object} options.dedupe Coordinate cache misses across instances
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
    track,
    datasourceName,
    stats,
    dedupe = false,
    acquireLockFunc = acquireLock,
    sleepFunc = sleep,
  }
) {
  const dedupeOptions = typeof dedupe === "object" ? dedupe : {};
  const lockTtlMs = dedupeOptions.lockTtlMs || 5_000;
  const waitTimeoutMs = dedupeOptions.waitTimeoutMs || 3_000;
  const pollIntervalMs = dedupeOptions.pollIntervalMs || 100;

  // Another instance owns this cache miss. Wait briefly for its result, but
  // return null on timeout so this request can fetch the data itself.
  async function waitForCachedValue(key) {
    const startedAt = performance.now();
    const deadline = performance.now() + waitTimeoutMs;

    try {
      while (performance.now() < deadline) {
        const [cachedValue] = await mgetFunc(
          [key],
          inMemory,
          stats,
          datasourceName
        );
        if (cachedValue) {
          return cachedValue;
        }
        await sleepFunc(pollIntervalMs);
      }

      return null;
    } finally {
      stats?.addDedupeWait(datasourceName, performance.now() - startedAt);
    }
  }

  async function tryAcquireLock(key) {
    try {
      // true: this request fetches, false: another request fetches,
      // null: Redis failed, so this request fetches without deduplication.
      return await acquireLockFunc({ key, ttlMs: lockTtlMs });
    } catch (e) {
      // Cache coordination must never block the primary datasource.
      return null;
    }
  }

  /**
   * This is a DataLoader batch function
   * It fetches as many keys from Redis as possible.
   * The rest will be fetched via the batchFunc that
   * is given to the outer function.
   * Finally, missing values are sent to Redis
   *
   * @param {Array.<string>} keys The keys to fetch
   */
  async function redisBatchLoader(keys) {
    const now = Date.now();

    // Create array of prefixed keys
    const prefixedKeys = keys.map((key) => createPrefixedKey(prefix, key));

    // Get values of all prefixed keys from Redis
    const cachedValues = await mgetFunc(
      prefixedKeys,
      inMemory,
      stats,
      datasourceName
    );

    // Remember where missing and stale values belong in the original arrays.
    // A missing position may become a cache hit while we wait for another pod.
    let missingIndexes = [];
    const staleIndexes = [];
    cachedValues.forEach((val, idx) => {
      if (!val) {
        missingIndexes.push(idx);
      } else if (now - val._redis_stored > ttl * 1000) {
        staleIndexes.push(idx);
      }
    });

    stats?.incrementRedisLookups(datasourceName, keys.length);
    stats?.incrementRedisHits(
      datasourceName,
      keys.length - missingIndexes.length - staleIndexes.length
    );

    if (dedupe && missingIndexes.length > 0) {
      await Promise.all(
        missingIndexes.map(async (index) => {
          const cacheKey = prefixedKeys[index];
          const acquired = await tryAcquireLock(cacheKey);

          // The lock holder fetches. Everyone else waits for its cache write.
          if (acquired === false) {
            cachedValues[index] = await waitForCachedValue(cacheKey);
          }
        })
      );
      // A timeout or Redis failure is a normal miss and fetches without a lock.
      missingIndexes = missingIndexes.filter((index) => !cachedValues[index]);
    }

    // Convert the remaining positions back to the keys batchFunc understands.
    const missingKeys = missingIndexes.map((index) => keys[index]);
    const staleKeys = staleIndexes.map((index) => keys[index]);

    // Fetch missing values using the provided batch function
    let values;
    if (missingKeys.length > 0) {
      values = await batchFunc(missingKeys);

      const writes = missingKeys.map((key, idx) => {
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

      // Waiting instances need the value to be visible before this one returns.
      if (dedupe) {
        await Promise.all(writes);
      }
    }

    // Refresh stale values, we don't await
    (async () => {
      if (staleKeys.length > 0) {
        let keysToRefresh = staleKeys;
        if (dedupe) {
          const decisions = await Promise.all(
            staleKeys.map((key) =>
              tryAcquireLock(createPrefixedKey(prefix, key))
            )
          );
          // Stale data is returned immediately; only lock holders refresh it.
          // On Redis failure we refresh normally instead of blocking the flow.
          keysToRefresh = staleKeys.filter(
            (_key, index) => decisions[index] !== false
          );
        }

        if (keysToRefresh.length === 0) {
          return;
        }

        const refreshedValues = await batchFunc(keysToRefresh);
        const writes = keysToRefresh.map((key, idx) => {
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
        if (dedupe) {
          await Promise.all(writes);
        }
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
 * Delete a Redis cache by prefixed key
 *
 */
export async function clearRedis(prefix, key) {
  const prefixedKey = createPrefixedKey(prefix, key);
  const redis = connection.getRedis();
  await redis.del(prefixedKey);
}

/**
 * The status function
 *
 * @throws Will throw error if service is down
 */
export function status() {
  if (!connection.isConnected()) {
    throw new Error("Redis is not connected");
  }
}

// Connect if Redis is enabled
if (
  config.datasources.redis.enabled === true ||
  config.datasources.redis.enabled === "true"
) {
  connection.connect();
}

export { teamLabel };
