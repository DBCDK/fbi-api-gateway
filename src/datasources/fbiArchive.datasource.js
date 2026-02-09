import config from "../config";

const { url, prefix, teamLabel, ttl } = config.datasources.fbiArchive;

export async function load(pid, context) {
  const localId = pid?.split?.(":")?.[1];
  const res = await context?.fetch(`${url}/id/${localId}`, {
    allowedErrorStatusCodes: [404],
  });
  return res?.body?.map((entry) => ({
    ...entry,
    url: `${url}/file/${entry?.key?.localId}?field=${entry?.key?.field}`,
  }));
}

export const options = {
  redis: {
    prefix,
    ttl,
  },
};

export { teamLabel };
