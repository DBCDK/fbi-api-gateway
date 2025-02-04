import config from "../../config";

const { url, prefix, teamLabel } = config.datasources.bibevents;

const fieldMap = {
  TITLE: "title",
  CREATED_AT: "createdAt",
  UPDATED_AT: "updatedAt",
  STARTTIME: "startTime",
};

export async function load(args, context) {
  let argsCopy = { ...args };
  argsCopy.offset = argsCopy.offset || 0;
  argsCopy.limit =
    argsCopy.limit < 0 || argsCopy.limit > 100 ? 10 : argsCopy.limit;
  let queryParams = "";
  Object.entries(args || {}).forEach(([key, valArr]) => {
    function getDelimiter() {
      return queryParams.length > 0 ? "&" : "?";
    }
    if (Array.isArray(valArr)) {
      valArr.forEach((v) => {
        queryParams += getDelimiter() + key + "=" + encodeURIComponent(v);
      });
    } else {
      if (key === "sort") {
        queryParams += getDelimiter() + key + "=" + fieldMap[valArr.field];
        if (valArr.direction) {
          queryParams += ":" + valArr.direction;
        }
      } else {
        queryParams += getDelimiter() + key + "=" + encodeURIComponent(valArr);
      }
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

export { teamLabel };
