export default function hasExternalRequest(datasources, cacheCheck = true) {
  const datasourceList = datasources.stats.summary();

  const ignore = ["overall"];
  return !!Object.entries(datasourceList).filter(([k, v]) => {
    if (!ignore.includes(k)) {
      const { cacheMiss, cacheLookups } = v;
      const isExternal = !!datasources.getLoader(k)?.options?.external;
      const isCache = cacheLookups && !cacheMiss;
      return cacheCheck ? isExternal && !isCache : isExternal;
    }
  }).length;
}
