import { withRedis } from "../redis/redis.datasource";
import { createTracker } from "../../utils/tracker";

/**
 * The enhancedBatchFunction (redis batch function) calls different functions
 * Redis' mget and setex, and a batch function that loads data.
 *
 * We set up spy functions to see what arguments are provided
 * to those functions.
 *
 * And perform tests
 *
 */
async function testWithRedis({
  keys,
  prefixedKeys,
  mgetReturn,
  missingKeys,
  batchReturn,
  newRedisEntries,
  output,
}) {
  let batchFunctionArgs = [];
  let mgetArgs = [];
  const setexArgs = [];

  // call withRedis with spy functions
  const enhancedBatchFunc = withRedis(
    (keys) => {
      batchFunctionArgs = keys;
      return batchReturn;
    },
    {
      prefix: "prefix",
      ttl: 10,
      setexFunc: (key, seconds, val) => {
        setexArgs.push({ key, seconds, val });
      },
      mgetFunc: (keys) => {
        mgetArgs = keys;
        return mgetReturn;
      },
    }
  );

  const result = await enhancedBatchFunc(keys);

  expect(mgetArgs).toEqual(prefixedKeys);
  expect(batchFunctionArgs).toEqual(missingKeys);
  expect(setexArgs).toEqual(newRedisEntries);

  expect(result).toEqual(output);
}
describe("Testing the withRedis higher order function", () => {
  test("No cache misses", async () => {
    // We ask for these keys
    const keys = ["a", "b", "c"];

    // We look for these in Redis
    const prefixedKeys = ["prefix_a", "prefix_b", "prefix_c"];

    // All values are in Redis
    const mgetReturn = [{ val: "a_res" }, { val: "b_res" }, { val: "c_res" }];

    // These are the keys missing
    const missingKeys = [];

    // The remaining are provided by batch function
    const batchReturn = [];

    // We update the Redis cache with this
    const newRedisEntries = [];

    // The final result should look like this
    const output = ["a_res", "b_res", "c_res"];

    await testWithRedis({
      keys,
      prefixedKeys,
      mgetReturn,
      missingKeys,
      batchReturn,
      newRedisEntries,
      output,
    });
  });

  test("Partial cache miss", async () => {
    // We ask for these keys
    const keys = ["a", "b", "c"];

    // We look for these in Redis
    const prefixedKeys = ["prefix_a", "prefix_b", "prefix_c"];

    // Some values are not found in Redis
    const mgetReturn = [null, { val: "b_res" }, null];

    // These are the keys missing
    const missingKeys = ["a", "c"];

    // The remaining are provided by batch function
    const batchReturn = ["a_res", "c_res"];

    // We update the Redis cache with this
    const newRedisEntries = [
      {
        key: "prefix_a",
        seconds: 10,
        val: "a_res",
      },
      {
        key: "prefix_c",
        seconds: 10,
        val: "c_res",
      },
    ];

    // The final result should look like this
    const output = ["a_res", "b_res", "c_res"];

    await testWithRedis({
      keys,
      prefixedKeys,
      mgetReturn,
      missingKeys,
      batchReturn,
      newRedisEntries,
      output,
    });
  });

  test("Error is not cached", async () => {
    const someError = new Error("some error");

    // We ask for these keys
    const keys = ["a", "b", "c"];

    // We look for these in Redis
    const prefixedKeys = ["prefix_a", "prefix_b", "prefix_c"];

    // No values are in Redis
    const mgetReturn = [null, null, null];

    // These are the keys missing
    const missingKeys = ["a", "b", "c"];

    // The remaining are provided by batch function
    // Including an error
    const batchReturn = ["a_res", someError, "c_res"];

    // We update the Redis cache with this
    // NO error here
    const newRedisEntries = [
      {
        key: "prefix_a",
        seconds: 10,
        val: "a_res",
      },
      {
        key: "prefix_c",
        seconds: 10,
        val: "c_res",
      },
    ];

    // The final result should look like this
    const output = ["a_res", someError, "c_res"];

    await testWithRedis({
      keys,
      prefixedKeys,
      mgetReturn,
      missingKeys,
      batchReturn,
      newRedisEntries,
      output,
    });
  });
});

/**
 * Shared fake Redis state lets separate withRedis wrappers represent separate
 * gateway instances without involving a real Redis cluster.
 *
 * These tests describe the distributed single-flight contract.
 */
function createSharedRedis() {
  const values = new Map();
  const locks = new Map();

  return {
    values,
    mgetFunc: async (keys) => keys.map((key) => values.get(key) || null),
    setexFunc: async (key, _seconds, val) => {
      values.set(key, { _redis_stored: Date.now(), val });
    },
    acquireLockFunc: async ({ key }) => {
      if (locks.has(key)) {
        return false;
      }
      locks.set(key, true);
      return true;
    },
  };
}

function createDedupedLoader(batchFunc, sharedRedis, dedupe = {}, stats) {
  return withRedis(batchFunc, {
    prefix: "prefix",
    ttl: 10,
    datasourceName: "userinfo",
    stats,
    staleWhileRevalidate: 60,
    mgetFunc: sharedRedis.mgetFunc,
    setexFunc: sharedRedis.setexFunc,
    acquireLockFunc: sharedRedis.acquireLockFunc,
    dedupe: {
      lockTtlMs: 100,
      waitTimeoutMs: 50,
      pollIntervalMs: 1,
      ...dedupe,
    },
  });
}

const wait = (milliseconds) =>
  new Promise((resolve) => setTimeout(resolve, milliseconds));

describe("Distributed Redis single-flight contract", () => {
  test("deduplicates a cold miss across gateway instances", async () => {
    // Example: One application sends three parallel requests with the same
    // user's token. Even if they hit different pods, userinfo is fetched once.
    const sharedRedis = createSharedRedis();
    const trackers = [createTracker(), createTracker(), createTracker()];
    let upstreamCalls = 0;
    const load = async (keys) => {
      upstreamCalls += 1;
      await wait(10);
      return keys.map((key) => `${key}_fresh`);
    };
    const instances = trackers.map((tracker) =>
      createDedupedLoader(load, sharedRedis, {}, tracker)
    );

    const results = await Promise.all(
      instances.map((instance) => instance(["same"]))
    );

    expect(results).toEqual([["same_fresh"], ["same_fresh"], ["same_fresh"]]);
    expect(upstreamCalls).toBe(1);
    expect(
      trackers.filter(
        (tracker) => tracker.summary().userinfo?.dedupeWaitMs > 0
      )
    ).toHaveLength(2);
  });

  test("preserves result positions when a miss becomes a hit", async () => {
    // Example: A batch asks for A, B and C. A is already cached, another pod
    // supplies B while we wait, and this pod fetches C. The caller must still
    // receive A, B and C in the original order.
    const sharedRedis = createSharedRedis();
    sharedRedis.values.set("prefix_a", {
      _redis_stored: Date.now(),
      val: "a_cached",
    });
    sharedRedis.acquireLockFunc = async ({ key }) => {
      if (key === "prefix_b") {
        setTimeout(() => {
          sharedRedis.values.set(key, {
            _redis_stored: Date.now(),
            val: "b_from_other_pod",
          });
        }, 5);
        return false;
      }
      return true;
    };
    const fetchedKeys = [];
    const loader = createDedupedLoader(async (keys) => {
      fetchedKeys.push(...keys);
      return keys.map((key) => `${key}_fetched_here`);
    }, sharedRedis);

    await expect(loader(["a", "b", "c"])).resolves.toEqual([
      "a_cached",
      "b_from_other_pod",
      "c_fetched_here",
    ]);
    expect(fetchedKeys).toEqual(["c"]);
  });

  test("does not serialize misses for different keys", async () => {
    // Example: Alice and Bob use different tokens at the same time. Alice's
    // lookup should not make Bob's wait because their cache keys differ.
    const sharedRedis = createSharedRedis();
    const upstreamKeys = [];
    const load = async (keys) => {
      upstreamKeys.push(...keys);
      await wait(10);
      return keys.map((key) => `${key}_fresh`);
    };
    const firstInstance = createDedupedLoader(load, sharedRedis);
    const secondInstance = createDedupedLoader(load, sharedRedis);

    const results = await Promise.all([
      firstInstance(["a"]),
      secondInstance(["b"]),
    ]);

    expect(results).toEqual([["a_fresh"], ["b_fresh"]]);
    expect(upstreamKeys.sort()).toEqual(["a", "b"]);
  });

  test("returns stale values immediately and deduplicates refresh", async () => {
    // Example: Cached userinfo has gone stale. Everyone gets the old value
    // immediately while only one pod refreshes it in the background.
    const sharedRedis = createSharedRedis();
    sharedRedis.values.set("prefix_same", {
      _redis_stored: Date.now() - 20_000,
      val: "same_stale",
    });
    let refreshCalls = 0;
    const load = async (keys) => {
      refreshCalls += 1;
      await wait(10);
      return keys.map((key) => `${key}_fresh`);
    };
    const instances = [
      createDedupedLoader(load, sharedRedis),
      createDedupedLoader(load, sharedRedis),
      createDedupedLoader(load, sharedRedis),
    ];

    const results = await Promise.all(
      instances.map((instance) => instance(["same"]))
    );

    expect(results).toEqual([["same_stale"], ["same_stale"], ["same_stale"]]);
    await wait(20);
    expect(refreshCalls).toBe(1);
    expect(sharedRedis.values.get("prefix_same").val).toBe("same_fresh");
  });

  test("falls back to upstream when lock waiting times out", async () => {
    // Example: The pod holding the lock is slow or has died. After a short
    // wait, another pod fetches userinfo so the request does not hang.
    const sharedRedis = createSharedRedis();
    let lockAttempts = 0;
    sharedRedis.acquireLockFunc = async () => {
      lockAttempts += 1;
      return false;
    };
    let upstreamCalls = 0;
    const loader = createDedupedLoader(
      async (keys) => {
        upstreamCalls += 1;
        return keys.map((key) => `${key}_fallback`);
      },
      sharedRedis,
      { waitTimeoutMs: 5 }
    );

    await expect(loader(["same"])).resolves.toEqual(["same_fallback"]);
    expect(lockAttempts).toBe(1);
    expect(upstreamCalls).toBe(1);
  });

  test("does not let a Redis lock failure block upstream", async () => {
    // Example: Redis is temporarily unavailable. The gateway should still
    // fetch userinfo directly, even though deduplication is lost temporarily.
    const sharedRedis = createSharedRedis();
    let lockAttempts = 0;
    sharedRedis.acquireLockFunc = async () => {
      lockAttempts += 1;
      throw new Error("Redis unavailable");
    };
    const loader = createDedupedLoader(
      async (keys) => keys.map((key) => `${key}_fresh`),
      sharedRedis
    );

    await expect(loader(["same"])).resolves.toEqual(["same_fresh"]);
    expect(lockAttempts).toBe(1);
  });
});
