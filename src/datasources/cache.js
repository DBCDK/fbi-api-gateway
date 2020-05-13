import NodeCache from 'node-cache';

export const cached = (fn, options) => {
  const cache = new NodeCache(options);

  return async params => {
    // generate cache key from params
    const key = JSON.stringify(params);

    // check if its a hit
    let res = cache.get(key);
    if (res) {
      // res may be a promise
      // then we await
      if (res.then) {
        return await res;
      }

      // the actual result
      return res;
    }

    // its a miss, we call the async function
    // and store promise in cache
    res = fn(params);
    cache.set(key, res);

    // we then resolve the promise
    // and store the result in cache
    res = await res;
    cache.set(key, res);

    return res;
  };
};
