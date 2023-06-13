import config from "../config";

const { url } = config.datasources.ocn2pid;

function parseForPid(xml) {
  const regex = /<pid value="([\s\S]*?)">/g;
  try {
    const matches = regex.exec(xml);
    return matches[1] || null;
  } catch (e) {
    console.log(e.message);
  }
}

export async function load({ oclc }, context) {
  const res = await context?.fetch(`${url}${oclc}`, {
    allowedErrorStatusCodes: [404],
  });
  return parseForPid(res?.body);
}
