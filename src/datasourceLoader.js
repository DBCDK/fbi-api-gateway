import DataLoader from "dataloader";

import { log } from "dbc-node-logger";
import { withRedis, clearRedis } from "./datasources/redis.datasource";
import { createFetchWithConcurrencyLimit } from "./utils/fetchWithLimit";
import { getFilesRecursive } from "./utils/utils";
import config from "./config";

// Find all datasources in src/datasources
export const datasources = getFilesRecursive(`${__dirname}/datasources`)
  .map((file) => {
    if (!file.path.endsWith(".datasource.js")) {
      return;
    }
    const { load, options, batchLoader, status, testLoad } = require(file.path);
    if (!load && !batchLoader) {
      return;
    }

    // Extract datasource name from filename
    const name = file.file.replace(".datasource.js", "");

    return {
      testLoad,
      load,
      batchLoader,
      name,
      options,
      statusChecker: status ? () => status(load) : null,
    };
  })
  .filter((func) => !!func);

const nameToDatasource = {};
datasources.forEach((ds) => (nameToDatasource[ds.name] = ds));

log.debug(
  `found ${datasources.length} datasources, ${datasources
    .map((datasource) => datasource.name)
    .join(", ")}`
);

/**
 * This will initialize a single dataloader.
 * It makes sure a context (with a concurrency limited fetcher), is injected
 * into the batchloader function.
 *
 * It sets up Redis for the dataloader
 *
 * It collects performance metrics for the datasource.
 */
function setupDataloader(
  { name, load, options, batchLoader, testLoad },
  context
) {
  const testModeActivated = context?.testUser && testLoad;
  const loadImpl = testModeActivated ? testLoad : load;

  let batchLoaderWithContext = batchLoader
    ? (keys) => batchLoader(keys, context)
    : (keys) => Promise.all(keys.map((key) => loadImpl(key, context)));

  if (!testModeActivated && options?.redis?.prefix && options?.redis?.ttl) {
    batchLoaderWithContext = withRedis(batchLoaderWithContext, {
      ...options.redis,
      ...context,
      datasourceName: name,
    });
  }

  async function batchLoaderWithTiming(keys) {
    context?.stats?.incrementCount(name, keys.length);

    try {
      return await batchLoaderWithContext(keys);
    } catch (err) {
      // Wraps the load call in a try catch, in order to capture the
      // stack trace before dataloader is called. Otherwise we would
      // be limited to see the stack trace from the data sources, but
      // not the GraphQL resolvers.
      // https://brunoscheufler.com/blog/2021-07-25-improving-dataloader-stack-traces
      if (err instanceof Error && err.stack) {
        const currentStack = { stack: "" };
        Error.captureStackTrace(currentStack, batchLoaderWithTiming);
        err.stack += currentStack.stack.replace("Error", "\nBefore DataLoader");
      }
      throw err;
    }
  }

  const loader = new DataLoader(batchLoaderWithTiming, {
    // If key is an object, we stringify
    // to make it useful as a cache key
    cacheKeyFn: (key) => (typeof key === "object" ? JSON.stringify(key) : key),
    maxBatchSize: 10,
  });

  if (options?.redis?.prefix) {
    loader.clearRedis = (key) => clearRedis(options?.redis?.prefix, key);
  }

  return {
    loader,
  };
}

// Time taken for processing JSON for this instance of FBI-API
let globalJsonProcessingMs = 0;
let globalBytesIn = 0;
/**
 * Collecting stats for datasources, divided into HTTP requests,
 * Redis requests, and JSON processing
 */
function createStats(uuid) {
  const startTime = performance.now();
  const globalJsonProcessingMsBegin = globalJsonProcessingMs;
  const globalBytsInBegin = globalBytesIn;
  const stats = {};
  const sum = {
    count: 0,
    redisHits: 0,
    redisLookups: 0,
    jsonParseSum: 0,
    jsonStringifySum: 0,
    waitingForServerResponseSum: 0,
    contentDownloadSum: 0,
    connectionStartSum: 0,
    totalSum: 0,
    bytesSum: 0,
  };
  function createEntry(key) {
    if (!stats[key]) {
      stats[key] = {
        count: 0,
        redisHits: 0,
        jsonParseSum: 0,
        jsonStringifySum: 0,
        waitingForServerResponseSum: 0,
        contentDownloadSum: 0,
        connectionStartSum: 0,
        totalSum: 0,
        bytesSum: 0,
        redisLookups: 0,
        http: [],
        redisSet: [],
        redisGet: [],
      };
    }
  }
  function sumTimings(key, obj) {
    [
      "jsonParse",
      "jsonStringify",
      "waitingForServerResponse",
      "contentDownload",
      "connectionStart",
      "total",
      "bytes",
    ].forEach((field) => {
      if (!obj[field]) {
        return;
      }
      stats[key][field + "Sum"] += obj[field];
      sum[field + "Sum"] += obj[field];
    });

    globalJsonProcessingMs += (obj.jsonParse || 0) + (obj.jsonStringify || 0);
    globalBytesIn += obj.bytes || 0;
  }
  function addHTTP(key, obj) {
    createEntry(key);
    sumTimings(key, obj);
    stats[key].http.push(obj);
  }
  function addRedisSet(key, obj) {
    createEntry(key);
    sumTimings(key, obj);
    stats[key].redisSet.push(obj);
  }
  function addRedisGet(key, obj) {
    createEntry(key);
    sumTimings(key, obj);
    stats[key].redisGet.push(obj);
  }
  function incrementCount(key, count) {
    createEntry(key);
    sum.count += count;
    stats[key].count += count;
  }
  function incrementRedisHits(key, count) {
    createEntry(key);
    sum.redisHits += count;
    stats[key].redisHits += count;
  }
  function incrementRedisLookups(key, count) {
    createEntry(key);
    sum.redisLookups += count;
    stats[key].redisLookups += count;
  }
  function summary() {
    const endTime = performance.now();
    const duration = endTime - startTime;
    const datasources = {};
    Object.entries(stats).forEach(([datasourceName, timings]) => {
      datasources[datasourceName] = {
        count: timings.count,
        bytesIn: timings.bytesSum,
        avgItemFetchMs: timings.totalSum / timings.count,
        cacheMiss: timings.redisLookups - timings.redisHits,
        cacheLookups: timings.redisLookups,
        jsonProcessingMs: timings.jsonParseSum + timings.jsonStringifySum,
      };
    });

    datasources.all = {
      count: sum.count,
      cacheMiss: sum.redisLookups - sum.redisHits,
      cacheLookups: sum.redisLookups,
      jsonParseMs: sum.jsonParseSum,
      jsonStringifyMs: sum.jsonStringifySum,
      jsonProcessingMs: sum.jsonParseSum + sum.jsonStringifySum,
      avgItemFetchMs: sum.totalSum / sum.count,
      bytesIn: sum.bytesSum,
      globalJsonLoad:
        (globalJsonProcessingMs - globalJsonProcessingMsBegin) / duration,
      globalBytesInPerSecond:
        ((globalBytesIn - globalBytsInBegin) / duration) * 1000,
    };

    return datasources;
  }
  return {
    addHTTP,
    addRedisSet,
    addRedisGet,
    incrementCount,
    incrementRedisHits,
    incrementRedisLookups,
    summary,
    uuid,
  };
}

/**
 * Will instantiate dataloaders from datasources.
 * This should be done for every incoming GraphQL request
 */
export default function createDataLoaders(uuid, testUser, accessToken) {
  const result = {};
  const stats = createStats(uuid);
  result.stats = stats;

  const fetchWithConcurrencyLimit = createFetchWithConcurrencyLimit(
    config.fetchConcurrencyLimit,
    stats
  );
  // Gets a loader by name.
  // A loader will be initialized first time it is called
  function getLoader(name) {
    if (!result[name]) {
      result[name] = setupDataloader(nameToDatasource[name], {
        getLoader,
        fetch: (url, options) => fetchWithConcurrencyLimit(url, options, name),
        trackingId: uuid,
        testUser,
        accessToken,
        stats,
      })?.loader;
    }
    return result[name];
  }
  result.getLoader = getLoader;
  return result;
}

/**
 * For testing
 */
export function createMockedDataLoaders() {
  const mockedDatasources = {};
  getFilesRecursive("./src/datasources/mocked")
    .filter(
      (file) =>
        file.path.endsWith("datasource.mocked.js") && require(file.path).load
    )
    .map((file) => ({
      ...file,
      name: file.file.replace(".datasource.mocked.js", ""),
      load: require(file.path).load,
      clearRedis: () => {},
    }))
    .forEach((loader) => {
      mockedDatasources[loader.name] = loader;
    });

  mockedDatasources.getLoader = (name) => mockedDatasources[name];

  return mockedDatasources;
}

export function createTestUserDataLoaders() {
  const mockedDataLoaders = createMockedDataLoaders();
  getFilesRecursive("./src/datasources")
    .filter(
      (file) =>
        file.path.endsWith("datasource.js") && require(file.path).testLoad
    )
    .map((file) => ({
      ...file,
      name: file.file.replace(".datasource.js", ""),
      load: require(file.path).testLoad,
      clearRedis: () => {},
    }))
    .forEach((loader) => {
      mockedDataLoaders[loader.name] = loader;
    });

  return mockedDataLoaders;
}
