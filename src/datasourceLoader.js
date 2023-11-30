import DataLoader from "dataloader";

import { log } from "dbc-node-logger";
import { withRedis, clearRedis } from "./datasources/redis.datasource";
import { createFetchWithConcurrencyLimit } from "./utils/fetchWithLimit";
import { getFilesRecursive } from "./utils/utils";
import config from "./config";

/*
  This is how we time parallel requests to a single datasource.
  
  Request A
  ------------
          Request B
          ------------------
                                      Request C
                                      -----------
  Total AB
  --------------------------
  
  The totaltime for the requests should NOT be:
  Request A + Request B + Request C
  
  But instead:
  Total AB + Request C
*/

export const trackMe = () => {
  return {
    start: function (uuid) {
      this.uuid = uuid;
      return this;
    },
    createTracker: function (name) {
      // If this datasource has not been tracked yet, initialize its tracking object.
      if (!this.trackObject[name]) {
        this.trackObject[name] = {
          overlappingRequestCount: 0, // Number of ongoing requests for this datasource.
          count: 0, // Total number of elements retrieved from datasource
          started: 0, // Timestamp when the first concurrent request starts.
          time: 0, // Total time taken for all requests so far.
          sequentialTime: 0, // If requests were to be run sequentially, this is the total time
          batches: 0, // Dataloader batches multiple requests, into a single request when possible
        };
      }
    },

    // Function to indicate the beginning of a datasource call.
    begin: function (name, count) {
      this.createTracker(name);

      const beginTime = performance.now();

      const trackObject = this.trackObject[name];

      // Increment the count of ongoing requests.
      trackObject.overlappingRequestCount++;

      // Increment total number of elements retrieved from datasource
      trackObject.count += count;
      trackObject.batches++;

      // Function to indicate the end of an datasource call.
      return function end() {
        const endTime = performance.now();
        const duration = Math.round(endTime - beginTime);
        // Decrement the count of ongoing requests.
        trackObject.overlappingRequestCount--;

        // If all ongoing requests are complete, calculate the time taken.
        if (trackObject.overlappingRequestCount === 0) {
          trackObject.time += duration;
        }

        trackObject.sequentialTime += duration;
      };
    },

    cacheMiss: function (name, count) {
      this.createTracker(name);

      this.trackObject[name].cacheMiss =
        (this.trackObject[name].cacheMiss || 0) + count;
    },
    uuid: null,
    trackObject: {},
    getMetrics: function () {
      const res = {};

      Object.entries(this.trackObject).forEach(([key, val]) => {
        res[key] = {
          count: val.count,
          time: val.time,
          cacheMiss: val.cacheMiss,
          avg_ms: Math.round(val.sequentialTime / val.count),
        };
      });

      return res;
    },
  };
};

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
    const end = context?.track?.begin?.(name, keys.length);

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
    } finally {
      end?.();
    }
  }

  const loader = new DataLoader(batchLoaderWithTiming, {
    // If key is an object, we stringify
    // to make it useful as a cache key
    cacheKeyFn: (key) => (typeof key === "object" ? JSON.stringify(key) : key),
    maxBatchSize: 100,
  });

  if (options?.redis?.prefix) {
    loader.clearRedis = (key) => clearRedis(options?.redis?.prefix, key);
  }

  return {
    loader,
  };
}

/**
 * Will instantiate dataloaders from datasources.
 * This should be done for every incoming GraphQL request
 */
export default function createDataLoaders(uuid, testUser, accessToken) {
  const result = {};
  const track = trackMe().start(uuid);

  result.trackingObject = track;
  const fetchWithConcurrencyLimit = createFetchWithConcurrencyLimit(
    config.fetchConcurrencyLimit
  );
  // Gets a loader by name.
  // A loader will be initialized first time it is called
  function getLoader(name) {
    if (!result[name]) {
      result[name] = setupDataloader(nameToDatasource[name], {
        getLoader,
        track,
        fetch: (url, options) => fetchWithConcurrencyLimit(url, options, name),
        trackingId: uuid,
        testUser,
        accessToken,
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
