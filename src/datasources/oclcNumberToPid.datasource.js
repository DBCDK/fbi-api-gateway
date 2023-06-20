import config from "../config";

const { url } = config.datasources.ocn2pid;

function parseForPid(xml) {
  const regex = /<pid value="([\s\S]*?)">/g;
  try {
    const matches = xml.matchAll(regex);
    const pids = [];
    for (let match of matches) {
      pids.push(match[1]);
    }
    return pids.find((pid) => pid.startsWith("870970")) || pids[0] || null;
  } catch (e) {
    console.log(e.message);
    return null;
  }
}

export async function load({ oclc }, context) {
  const res = await context?.fetch(`${url}${oclc}`, {
    allowedErrorStatusCodes: [404],
  });
  return parseForPid(res?.body);
}
