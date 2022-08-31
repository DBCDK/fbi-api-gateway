import { withRedis } from "../redis.datasource";

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
  test("No cache misses", () => {
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

    testWithRedis({
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

    testWithRedis({
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

    testWithRedis({
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
