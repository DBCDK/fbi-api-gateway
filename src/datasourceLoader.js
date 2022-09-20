import DataLoader from "dataloader";

import { log } from "dbc-node-logger";
import { withRedis } from "./datasources/redis.datasource";
import { createFetchWithConcurrencyLimit } from "./utils/fetchWithLimit";
import { getFilesRecursive } from "./utils/utils";
import config from "./config";

export const trackMe = () => {
  return {
    start: function (uuid) {
      this.uuid = uuid;
      return this;
    },
    track: function (name, time, count) {
      if (!this.trackObject[name]) {
        this.trackObject[name] = {};
      }
      this.trackObject[name].count =
        (this.trackObject[name].count || 0) + count;
      this.trackObject[name].time = (this.trackObject[name].time || 0) + time;
    },
    cacheMiss: function (name, count) {
      if (!this.trackObject[name]) {
        this.trackObject[name] = {};
      }
      this.trackObject[name].cacheMiss =
        (this.trackObject[name].cacheMiss || 0) + count;
    },
    uuid: null,
    trackObject: {},
  };
};

// Find all datasources in src/datasources
export const datasources = getFilesRecursive(`${__dirname}/datasources`)
  .map((file) => {
    if (!file.path.endsWith(".datasource.js")) {
      return;
    }
    const { load, options, batchLoader, status } = require(file.path);
    if (!load) {
      return;
    }

    // Extract datasource name from filename
    const name = file.file.replace(".datasource.js", "");

    return {
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
function setupDataloader({ name, load, options, batchLoader }, context) {
  let batchLoaderWithContext = batchLoader
    ? (keys) => batchLoader(keys, context)
    : (keys) => Promise.all(keys.map((key) => load(key, context)));

  if (options?.redis?.prefix && options?.redis?.ttl) {
    batchLoaderWithContext = withRedis(batchLoaderWithContext, {
      ...options.redis,
      ...context,
      datasourceName: name,
    });
  }

  async function batchLoaderWithTiming(keys) {
    const start = new Date().getTime();
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
      const count = keys.length;
      const end = new Date().getTime();
      context.track.track(name, end - start, count);
    }
  }

  const loader = new DataLoader(batchLoaderWithTiming, {
    // If key is an object, we stringify
    // to make it useful as a cache key
    cacheKeyFn: (key) => (typeof key === "object" ? JSON.stringify(key) : key),
    maxBatchSize: 100,
  });

  return {
    loader,
  };
}

/**
 * Will instantiate dataloaders from datasources.
 * This should be done for every incoming GraphQL request
 */
export default function createDataLoaders(uuid) {
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
        track,
        fetch: fetchWithConcurrencyLimit,
        trackingId: uuid,
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
    }))
    .forEach((loader) => {
      mockedDatasources[loader.name] = loader;
    });
  mockedDatasources.getLoader = (name) => mockedDatasources[name];
  return mockedDatasources;
}
