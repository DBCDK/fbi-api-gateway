import config from "../config";

const { url, ttl } = config.datasources.openformat;

function parseResponse(response) {
  // @TODO check for errors
  return splitResponse(response?.formatResponse?.refWorks[0]?.$);
}

function splitResponse(ref) {
  // The first tag in refwork will always be the RT tag which determines what RefWorks record type to use.
  // if asked for multiple records openformat doesn't add a linebreak before the RT tag which is needed
  // in the refwork tool to understand it. We insert a linebreak here.
  // const regexp = /^RT .*/gm;
  const regexp = /(^RT .*\b)(?![\s\S]*\b\1\b)/gm;
  // const matches = ref.match(regexp);

  return ref.replace(regexp, function (match) {
    return "\n" + match;
  });
}

export async function load({ pids }, context) {
  const response = (
    await context?.fetch(
      `${url}?action=formatObject&pid=${pids.join(
        ","
      )}&outputFormat=refWorks&outputType=json`
    )
  ).body;
  return parseResponse(response);
}

export const options = {
  redis: {
    prefix: "refworks-1",
    ttl,
    staleWhileRevalidate: 60 * 60 * 24 * 30, // 30 days
  },
};
