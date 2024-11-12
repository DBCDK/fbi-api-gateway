import config from "../../config";

const { url, prefix } = config.datasources.bibevents;

export async function load(args, context) {
  let argsCopy = { ...args };
  argsCopy.offset = argsCopy.offset || 0;
  argsCopy.limit =
    argsCopy.limit < 0 || argsCopy.limit > 100 ? 10 : argsCopy.limit;
  let queryParams = "";
  Object.entries(args || {}).forEach(([key, valArr]) => {
    const delimiter = queryParams.length > 0 ? "&" : "?";
    if (Array.isArray(valArr)) {
      valArr.forEach((v) => {
        queryParams += delimiter + key + "=" + encodeURIComponent(v);
      });
    } else {
      queryParams += delimiter + key + "=" + encodeURIComponent(valArr);
    }
  });
  const res = await context.fetch(`${url}/api/events${queryParams}`);
  return res;
}

export const options = {
  redis: {
    prefix: "bibevents-" + prefix,
    ttl: 60 * 5,
  },
};
