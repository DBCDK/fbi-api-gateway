/**
 *
 */
function createTrackEntry() {
  return {
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
    redisTimeSum: 0,
  };
}

/**
 * Tracker for collecting stats for datasources, divided into HTTP requests,
 * Redis requests, and JSON processing
 */
export function createTracker(uuid) {
  const trackerObj = {
    overall: createTrackEntry(),
    datasources: {},
  };

  return {
    addHTTP: (key, obj) => addHTTP(key, obj, trackerObj),
    addRedisSet: (key, obj) => addRedisSet(key, obj, trackerObj),
    addRedisGet: (key, obj) => addRedisGet(key, obj, trackerObj),
    incrementCount: (key, count) => incrementCount(key, count, trackerObj),
    incrementRedisHits: (key, count) =>
      incrementRedisHits(key, count, trackerObj),
    incrementRedisLookups: (key, count) =>
      incrementRedisLookups(key, count, trackerObj),
    summary: () => summary(trackerObj),
    uuid,
  };
}

function summary(trackerObj) {
  const datasources = {};
  Object.entries(trackerObj.datasources).forEach(
    ([datasourceName, timings]) => {
      datasources[datasourceName] = {
        count: timings.count,
        bytesIn: timings.bytesSum,
        avgItemFetchMs: timings.totalSum / timings.count,
        cacheMiss: timings.redisLookups - timings.redisHits,
        cacheLookups: timings.redisLookups,
        jsonProcessingMs: timings.jsonParseSum + timings.jsonStringifySum,
        avgCacheTimeMs: timings.redisTimeSum / timings.redisLookups || 0,
      };
    }
  );

  datasources.overall = {
    count: trackerObj.overall.count,
    cacheMiss: trackerObj.overall.redisLookups - trackerObj.overall.redisHits,
    cacheLookups: trackerObj.overall.redisLookups,
    jsonParseMs: trackerObj.overall.jsonParseSum,
    jsonStringifyMs: trackerObj.overall.jsonStringifySum,
    jsonProcessingMs:
      trackerObj.overall.jsonParseSum + trackerObj.overall.jsonStringifySum,
    avgItemFetchMs: trackerObj.overall.totalSum / trackerObj.overall.count,
    bytesIn: trackerObj.overall.bytesSum,
    avgCacheTimeMs:
      trackerObj.overall.redisTimeSum / trackerObj.overall.redisLookups || 0,
  };

  return datasources;
}

function createEntry(key, trackerObj) {
  if (!trackerObj.datasources[key]) {
    trackerObj.datasources[key] = createTrackEntry();
  }
}
function sumTimings(key, obj, trackerObj) {
  Object.entries(obj).forEach(([field, val]) => {
    const fieldSumName = field + "Sum";
    if (typeof trackerObj.overall[fieldSumName] === "number") {
      trackerObj.overall[fieldSumName] += val || 0;
      trackerObj.datasources[key][fieldSumName] += val || 0;
    }
  });
}
function addHTTP(key, obj, trackerObj) {
  createEntry(key, trackerObj);
  sumTimings(key, obj, trackerObj);
}
function addRedisSet(key, obj, trackerObj) {
  createEntry(key, trackerObj);
  sumTimings(key, obj, trackerObj);
}
function addRedisGet(key, obj, trackerObj) {
  createEntry(key, trackerObj);
  sumTimings(key, obj, trackerObj);
}
function incrementCount(key, count, trackerObj) {
  createEntry(key, trackerObj);
  trackerObj.overall.count += count;
  trackerObj.datasources[key].count += count;
}
function incrementRedisHits(key, count, trackerObj) {
  createEntry(key, trackerObj);
  trackerObj.overall.redisHits += count;
  trackerObj.datasources[key].redisHits += count;
}
function incrementRedisLookups(key, count, trackerObj) {
  createEntry(key, trackerObj);
  trackerObj.overall.redisLookups += count;
  trackerObj.datasources[key].redisLookups += count;
}
