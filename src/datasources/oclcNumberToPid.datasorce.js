import config from "../config";

const { url } = config.datasources.ocn2pid;

function parseForPid(xml) {
  console.log(xml, "XML");
}

export async function load({ oclcNumber = 1200830771 }, context) {
  const res = await context?.fetch(`${url}/${oclcNumber}`, {
    allowedErrorStatusCodes: [404],
  });

  console.log(res, "OCLCES");

  return parseForPid(res);
}
